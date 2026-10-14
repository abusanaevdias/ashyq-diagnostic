export type DocxBlock={kind:'paragraph'|'heading1'|'heading2'|'heading3';text:string};
export const MAX_DOCX_TEXT_BYTES=2_000_000,MAX_DOCX_PACKAGE_BYTES=12_000_000,MAX_DOCX_BLOCKS=10_000;
export const DOCX_MIME='application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const encoder=new TextEncoder();
const crcTable=Uint32Array.from({length:256},(_,value)=>{let n=value;for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc32(bytes:Uint8Array){let crc=0xffffffff;for(const byte of bytes)crc=crcTable[(crc^byte)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;}
const escapeXml=(value:string)=>value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]!));
/** Word report, not a restore format. XML-illegal code points are visible escapes, never hidden deletion. */
function displayText(value:string){let changed=false;const text=Array.from(value,char=>{const point=char.codePointAt(0)!;if(point===9||point===10||point===13||point>=32&&point<=0xd7ff||point>=0xe000&&point<=0xfffd||point>=0x10000&&point<=0x10ffff)return char;changed=true;return `⟦U+${point.toString(16).toUpperCase().padStart(4,'0')}⟧`;}).join('');return {text,changed};}
function paragraph(block:DocxBlock){const style=block.kind==='paragraph'?'Normal':`Heading${block.kind.slice(-1)}`;const runs=block.text.split(/\r\n|\r|\n/).map(line=>line.split('\t').map(part=>`<w:r><w:t xml:space="preserve">${escapeXml(part)}</w:t></w:r>`).join('<w:r><w:tab/></w:r>')).join('<w:r><w:br/></w:r>');return `<w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr>${runs}</w:p>`;}
function zip(parts:Array<{name:string;text:string}>){
 const files=parts.map(part=>({name:encoder.encode(part.name),data:encoder.encode(part.text)})),locals:Uint8Array[]=[],centrals:Uint8Array[]=[];let offset=0;
 for(const file of files){
  const crc=crc32(file.data),local=new Uint8Array(30+file.name.length),header=new DataView(local.buffer);header.setUint32(0,0x04034b50,true);header.setUint16(4,20,true);header.setUint16(6,0x0800,true);header.setUint16(12,0x21,true);header.setUint32(14,crc,true);header.setUint32(18,file.data.length,true);header.setUint32(22,file.data.length,true);header.setUint16(26,file.name.length,true);local.set(file.name,30);
  const central=new Uint8Array(46+file.name.length),directory=new DataView(central.buffer);directory.setUint32(0,0x02014b50,true);directory.setUint16(4,20,true);directory.setUint16(6,20,true);directory.setUint16(8,0x0800,true);directory.setUint16(14,0x21,true);directory.setUint32(16,crc,true);directory.setUint32(20,file.data.length,true);directory.setUint32(24,file.data.length,true);directory.setUint16(28,file.name.length,true);directory.setUint32(42,offset,true);central.set(file.name,46);locals.push(local,file.data);centrals.push(central);offset+=local.length+file.data.length;
 }
 const centralSize=centrals.reduce((size,part)=>size+part.length,0),end=new Uint8Array(22),footer=new DataView(end.buffer);footer.setUint32(0,0x06054b50,true);footer.setUint16(8,files.length,true);footer.setUint16(10,files.length,true);footer.setUint32(12,centralSize,true);footer.setUint32(16,offset,true);
 const total=offset+centralSize+end.length;if(total>MAX_DOCX_PACKAGE_BYTES)throw new Error('Отчёт Word превышает лимит. Скачай исходную работу в JSON.');const result=new Uint8Array(total);let cursor=0;for(const part of [...locals,...centrals,end]){result.set(part,cursor);cursor+=part.length;}return result;
}
/** Dependency-free text-only OOXML: fixed internal paths, no macros, embedded files or external relationships. */
export function buildPlainDocx(blocks:DocxBlock[]):Uint8Array{
 if(!Array.isArray(blocks)||!blocks.length||blocks.length>MAX_DOCX_BLOCKS)throw new Error('Неверный объём отчёта Word.');let bytes=0,escaped=false;
 const rendered=blocks.map(block=>{if(!block||typeof block!=='object'||Object.keys(block).length!==2||!Object.hasOwn(block,'kind')||!Object.hasOwn(block,'text')||!['paragraph','heading1','heading2','heading3'].includes(block.kind)||typeof block.text!=='string')throw new Error('Неверный блок отчёта Word.');bytes+=encoder.encode(block.text).length;if(bytes>MAX_DOCX_TEXT_BYTES)throw new Error('Текст отчёта Word превышает лимит. Скачай исходную работу в JSON.');const display=displayText(block.text);escaped||=display.changed;return {...block,text:display.text};});
 if(escaped)rendered.unshift({kind:'paragraph',text:'Непечатаемые или недопустимые для XML символы показаны как ⟦U+XXXX⟧. Word — читаемый отчёт; для точного восстановления используй исходный JSON.'});
 const declaration='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',wordNs='http://schemas.openxmlformats.org/wordprocessingml/2006/main',relNs='http://schemas.openxmlformats.org/package/2006/relationships';
 const styles=declaration+`<w:styles xmlns:w="${wordNs}"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:pPr><w:spacing w:after="120"/></w:pPr><w:rPr><w:sz w:val="24"/></w:rPr></w:style>${[1,2,3].map(level=>`<w:style w:type="paragraph" w:styleId="Heading${level}"><w:name w:val="heading ${level}"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="120"/><w:outlineLvl w:val="${level-1}"/></w:pPr><w:rPr><w:b/><w:sz w:val="${level===1?32:level===2?28:26}"/></w:rPr></w:style>`).join('')}</w:styles>`;
 return zip([
  {name:'[Content_Types].xml',text:declaration+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>'},
  {name:'_rels/.rels',text:declaration+`<Relationships xmlns="${relNs}"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`},
  {name:'word/document.xml',text:declaration+`<w:document xmlns:w="${wordNs}"><w:body>${rendered.map(paragraph).join('')}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`},
  {name:'word/styles.xml',text:styles},
  {name:'word/_rels/document.xml.rels',text:declaration+`<Relationships xmlns="${relNs}"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`},
 ]);
}

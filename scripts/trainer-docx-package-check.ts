import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {buildPlainDocx,MAX_DOCX_BLOCKS,MAX_DOCX_TEXT_BYTES,type DocxBlock} from '../src/lib/trainers/docx-package';
const blocks:DocxBlock[]=[{kind:'heading1',text:'ASHYQ · Учебная работа'},{kind:'heading2',text:'First answer <not a score> & revision'},{kind:'paragraph',text:'  Exact leading and trailing spaces  '},{kind:'paragraph',text:'Первая строка\nSecond line\twith tab. Emoji: 🧪.'},{kind:'paragraph',text:'Unsafe XML controls: \0 \u0001 \ud800 \ufffe; literal \u0000 is not an instruction.'},{kind:'heading3',text:'Raw markup stays text'},{kind:'paragraph',text:'<script>alert("not executable")</script> & <w:hyperlink>not active</w:hyperlink>'}];
const first=buildPlainDocx(blocks);assert.deepEqual(buildPlainDocx(blocks),first);assert.equal(new DataView(first.buffer).getUint32(0,true),0x04034b50);assert.equal(new DataView(first.buffer).getUint32(first.length-22,true),0x06054b50);
for(const bad of [null,[],Array(MAX_DOCX_BLOCKS+1).fill(blocks[0]),[{kind:'unknown',text:'x'}],[{kind:['paragraph'],text:'x'}],[{kind:'paragraph',text:4}],[{kind:'paragraph',text:'x',url:'https://example.invalid'}],[{kind:'paragraph',text:'x'.repeat(MAX_DOCX_TEXT_BYTES+1)}]])assert.throws(()=>buildPlainDocx(bad as DocxBlock[]));
const dir=path.resolve('artifacts/trainers-complete-033'),file=path.join(dir,'docx-package-synthetic.docx');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(file,first);
const result=execFileSync('python',['-c',String.raw`import sys,zipfile,xml.etree.ElementTree as E
with zipfile.ZipFile(sys.argv[1]) as z:
 assert z.testzip() is None
 assert sorted(z.namelist())==sorted(['[Content_Types].xml','_rels/.rels','word/document.xml','word/styles.xml','word/_rels/document.xml.rels'])
 for name in z.namelist(): E.fromstring(z.read(name))
 root=E.fromstring(z.read('word/document.xml')); ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
 text='\n'.join(n.text or '' for n in root.findall('.//w:t',ns))
 assert 'Exact leading and trailing spaces  ' in text and '  Exact leading' in text
 assert 'Первая строка' in text and '🧪' in text
 assert '⟦U+0000⟧' in text and '⟦U+D800⟧' in text and '⟦U+FFFE⟧' in text
 assert '<script>alert("not executable")</script>' in text
 assert not root.findall('.//w:hyperlink',ns)
 assert len(root.findall('.//w:br',ns))==1
 assert len(root.findall('.//w:tab',ns))==1
 for name in ['_rels/.rels','word/_rels/document.xml.rels']:
  for rel in E.fromstring(z.read(name)): assert rel.get('TargetMode')!='External' and '..' not in rel.get('Target','')
 print('PASS ZIP CRC/paths and all XML parts: Unicode/whitespace/newline/text-only markup/visible control escapes and no external relationships or macros.')`,file],{encoding:'utf8'});console.log(result.trim());
console.log('PASS deterministic bounded text-only DOCX packaging and invalid block/input rejection. Primitive only: no trainer integration, Office visual rendering, restored work or quality score claim.');

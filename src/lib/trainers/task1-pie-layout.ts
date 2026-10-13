/** Caller validates percentage composition. Values are never altered to fit labels. */
export function task1PieLayout(values:number[]){
  const sectors=values.map((value,index)=>{
    const start=values.slice(0,index).reduce((sum,v)=>sum+v,0)/100*Math.PI*2-Math.PI/2,end=start+value/100*Math.PI*2,mid=(start+end)/2;
    const point=(a:number)=>[200+130*Math.cos(a),200+130*Math.sin(a)];const [x1,y1]=point(start),[x2,y2]=point(end);
    return{index,start,end,fullCircle:value===100,path:`M200 200 L${x1} ${y1} A130 130 0 ${value>50?1:0} 1 ${x2} ${y2} Z`,side:Math.cos(mid)>=0?'right':'left',anchorX:200+135*Math.cos(mid),anchorY:200+135*Math.sin(mid),y:200+160*Math.sin(mid)};
  });
  const labels=['left','right'].flatMap(side=>sectors.filter(s=>s.side===side&&values[s.index]>0).sort((a,b)=>a.y-b.y)
    .reduce<typeof sectors>((placed,sector)=>[...placed,{...sector,y:Math.max(30,sector.y,(placed.at(-1)?.y??-4)+34)}],[])
    .reduceRight<typeof sectors>((placed,sector)=>[{...sector,y:Math.min(sector.y,placed[0]?placed[0].y-34:370)},...placed],[]));
  return{sectors,labels};
}

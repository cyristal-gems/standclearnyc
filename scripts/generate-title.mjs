import {writeFile} from 'node:fs/promises';
const name='Stand Clear of the Closing Doors, Please!';
const colors={S:'#808183',A:'#0039a6',C:'#0039a6',E:'#0039a6',B:'#ff6319',D:'#ff6319',F:'#ff6319',M:'#ff6319',G:'#6cbe45',J:'#996633',Z:'#996633',L:'#a7a9ac',N:'#fccc0a',Q:'#fccc0a',R:'#fccc0a',W:'#fccc0a'};
const escape=value=>value.replaceAll('&','&amp;').replaceAll('<','&lt;');
let x=12;const letters=[];
for(const letter of name.toUpperCase()){
 if(letter===' '){x+=22;continue;}
 if(letter===','){letters.push(`<text x="${x}" y="62" fill="#e7eef8" font-size="42">,</text>`);x+=18;continue;}
 const center=x+23,color=colors[letter];
 letters.push(color?`<circle cx="${center}" cy="40" r="22" fill="${color}"/><text x="${center}" y="54" text-anchor="middle" fill="${['N','Q','R','W'].includes(letter)?'#111':'#fff'}" font-size="39" font-weight="700">${letter}</text>`:`<text x="${center}" y="54" text-anchor="middle" fill="#e7eef8" font-size="43" font-weight="600">${letter}</text>`);
 x+=49;
}
const width=x+12;
const numbers=Array.from({length:7},(_,index)=>{const number=index+1,cx=width/2+(index-3)*35,color=number<4?'#ee352e':number<7?'#00933c':'#b933ad';return `<circle cx="${cx}" cy="85" r="10" fill="${color}"/><text x="${cx}" y="90" text-anchor="middle" fill="white" font-size="14" font-weight="700">${number}</text>`}).join('');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1996 98" role="img" aria-label="${name}"><title>${escape(name)}</title><g transform="translate(${(1996-width)/2} 0)" font-family="Arial,Helvetica,sans-serif">${letters.join('')}<path d="M${width/2-125} 85H${width/2+125}" stroke="#526a85" stroke-width="2"/>${numbers}</g></svg>\n`;
await writeFile(new URL('../public/route-title-inline.svg',import.meta.url),svg);
console.log(`Updated title artwork: ${width} × 98`);

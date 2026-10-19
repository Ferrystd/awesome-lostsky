import { chromium } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import { installPreviewRoutes } from './runtime.mjs'
import { chatFixture } from './remaining-fixtures.mjs'
const browser=await chromium.launch();const results=[];
try { for(const width of [1440,375]) { const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'});
const token='x.'+Buffer.from(JSON.stringify({uid:21,sub:21,act:{type:'teamMember',id:11,slug:'qingkong',name:'青空接单人'}})).toString('base64url')+'.x';
await context.addCookies([{name:'lostsky_token',value:token,domain:'.lostsky.work',path:'/'}]);
await context.addInitScript(()=>{window.Centrifuge=class{constructor(){throw Error('offline')}}});
const missing=[];const origin='http://chat.lostsky.work:4312';
await installPreviewRoutes(context,{app:'chat',origin,fixture:chatFixture,missing,mockedWrites:['POST /message/read','POST /realtime/connect']});
const page=await context.newPage();await page.goto(origin+'/?conversation=preview-group',{waitUntil:'networkidle'});
const contrast=await page.locator('.own:not(.revoked) .bubble').first().evaluate(el=>{
 const style=getComputedStyle(el);const ctx=document.createElement('canvas').getContext('2d');
 const rgb=color=>{ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].slice(0,3)};
 const luminance=color=>rgb(color).map(c=>{c/=255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4}).reduce((v,c,i)=>v+c*[.2126,.7152,.0722][i],0);
 const a=luminance(style.color),b=luminance(style.backgroundColor);return {foreground:style.color,background:style.backgroundColor,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
});if(contrast.ratio<4.5)throw Error('Bubble contrast '+contrast.ratio);
if(width<720)await page.getByRole('button',{name:'返回会话列表'}).click();
const rows=await page.locator('.conversation-row').evaluateAll(nodes=>nodes.map(node=>{
 const bound=node.getBoundingClientRect();return [...node.querySelectorAll('strong,small')].map(el=>{const r=el.getBoundingClientRect();const range=document.createRange();range.selectNodeContents(el);const text=range.getBoundingClientRect();return {text:el.textContent,width:r.width,height:r.height,textWidth:text.width,visibleWidth:Math.max(0,Math.min(r.right,bound.right,text.right)-Math.max(r.left,bound.left,text.left))}})
}));if(rows.length!==2||rows.flat().some(v=>!v.text||v.visibleWidth<Math.min(v.textWidth,80)-1||v.height<10))throw Error('Conversation copy clipped: '+JSON.stringify(rows));
if(missing.length)throw Error(missing.join(';'));results.push({width,contrast,rows,status:'passed'});await context.close();
}}finally{await browser.close()}
await writeFile('test-results/backoffice-previews/chat-visual-assertions.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));

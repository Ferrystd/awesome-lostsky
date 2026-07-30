import{a_ as N,av as E,az as b,aw as H,d as O,P as p,a$ as V,b0 as $,F as j,aC as A,aD as w,k,aZ as F,b1 as y}from"./index-49TE631d.js";let S=!1;function L(){if(N&&window.CSS&&!S&&(S=!0,"registerProperty"in(window==null?void 0:window.CSS)))try{CSS.registerProperty({name:"--n-color-start",syntax:"<color>",inherits:!1,initialValue:"#0000"}),CSS.registerProperty({name:"--n-color-end",syntax:"<color>",inherits:!1,initialValue:"#0000"})}catch{}}function T(e){const{heightSmall:i,heightMedium:r,heightLarge:s,borderRadius:a}=e;return{color:"#eee",colorEnd:"#ddd",borderRadius:a,heightSmall:i,heightMedium:r,heightLarge:s}}const D={common:E,self:T},I=b([H("skeleton",`
 height: 1em;
 width: 100%;
 transition:
 --n-color-start .3s var(--n-bezier),
 --n-color-end .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 animation: 2s skeleton-loading infinite cubic-bezier(0.36, 0, 0.64, 1);
 background-color: var(--n-color-start);
 `),b("@keyframes skeleton-loading",`
 0% {
 background: var(--n-color-start);
 }
 40% {
 background: var(--n-color-end);
 }
 80% {
 background: var(--n-color-start);
 }
 100% {
 background: var(--n-color-start);
 }
 `)]),K=Object.assign(Object.assign({},w.props),{text:Boolean,round:Boolean,circle:Boolean,height:[String,Number],width:[String,Number],size:String,repeat:{type:Number,default:1},animated:{type:Boolean,default:!0},sharp:{type:Boolean,default:!0}}),W=O({name:"Skeleton",inheritAttrs:!1,props:K,setup(e){L();const{mergedClsPrefixRef:i,mergedComponentPropsRef:r}=A(e),s=k(()=>{var n,t;return e.size||((t=(n=r==null?void 0:r.value)===null||n===void 0?void 0:n.Skeleton)===null||t===void 0?void 0:t.size)}),a=w("Skeleton","-skeleton",I,D,e,i);return{mergedClsPrefix:i,style:k(()=>{var n,t;const m=a.value,{common:{cubicBezierEaseInOut:z}}=m,h=m.self,{color:C,colorEnd:P,borderRadius:x}=h;let l;const{circle:d,sharp:B,round:R,width:o,height:c,text:f,animated:_}=e,v=s.value;v!==void 0&&(l=h[F("height",v)]);const u=d?(n=o??c)!==null&&n!==void 0?n:l:o,g=(t=d?o??c:c)!==null&&t!==void 0?t:l;return{display:f?"inline-block":"",verticalAlign:f?"-0.125em":"",borderRadius:d?"50%":R?"4096px":B?"":x,width:typeof u=="number"?y(u):u,height:typeof g=="number"?y(g):g,animation:_?"":"none","--n-bezier":z,"--n-color-start":C,"--n-color-end":P}})}},render(){const{repeat:e,style:i,mergedClsPrefix:r,$attrs:s}=this,a=p("div",V({class:`${r}-skeleton`,style:i},s));return e>1?p(j,null,$(e,null).map(n=>[a,`
`])):a}});export{W as N};

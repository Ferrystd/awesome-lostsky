import{bj as _,aa as j,as as v,at as A,d as E,Q as p,bk as H,bl as O,F as V,aA as F,aC as w,k,aN as L,bm as y}from"./index-DgcYrrlp.js";let S=!1;function T(){if(_&&window.CSS&&!S&&(S=!0,"registerProperty"in(window==null?void 0:window.CSS)))try{CSS.registerProperty({name:"--n-color-start",syntax:"<color>",inherits:!1,initialValue:"#0000"}),CSS.registerProperty({name:"--n-color-end",syntax:"<color>",inherits:!1,initialValue:"#0000"})}catch{}}function $(e){const{heightSmall:i,heightMedium:r,heightLarge:s,borderRadius:a}=e;return{color:"#eee",colorEnd:"#ddd",borderRadius:a,heightSmall:i,heightMedium:r,heightLarge:s}}const I={common:j,self:$},K=v([A("skeleton",`
 height: 1em;
 width: 100%;
 transition:
 --n-color-start .3s var(--n-bezier),
 --n-color-end .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 animation: 2s skeleton-loading infinite cubic-bezier(0.36, 0, 0.64, 1);
 background-color: var(--n-color-start);
 `),v("@keyframes skeleton-loading",`
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
 `)]),M=Object.assign(Object.assign({},w.props),{text:Boolean,round:Boolean,circle:Boolean,height:[String,Number],width:[String,Number],size:String,repeat:{type:Number,default:1},animated:{type:Boolean,default:!0},sharp:{type:Boolean,default:!0}}),W=E({name:"Skeleton",inheritAttrs:!1,props:M,setup(e){T();const{mergedClsPrefixRef:i,mergedComponentPropsRef:r}=F(e),s=k(()=>{var n,t;return e.size||((t=(n=r==null?void 0:r.value)===null||n===void 0?void 0:n.Skeleton)===null||t===void 0?void 0:t.size)}),a=w("Skeleton","-skeleton",K,I,e,i);return{mergedClsPrefix:i,style:k(()=>{var n,t;const g=a.value,{common:{cubicBezierEaseInOut:z}}=g,h=g.self,{color:C,colorEnd:x,borderRadius:P}=h;let l;const{circle:d,sharp:B,round:R,width:o,height:c,text:f,animated:N}=e,b=s.value;b!==void 0&&(l=h[L("height",b)]);const u=d?(n=o??c)!==null&&n!==void 0?n:l:o,m=(t=d?o??c:c)!==null&&t!==void 0?t:l;return{display:f?"inline-block":"",verticalAlign:f?"-0.125em":"",borderRadius:d?"50%":R?"4096px":B?"":P,width:typeof u=="number"?y(u):u,height:typeof m=="number"?y(m):m,animation:N?"":"none","--n-bezier":z,"--n-color-start":C,"--n-color-end":x}})}},render(){const{repeat:e,style:i,mergedClsPrefix:r,$attrs:s}=this,a=p("div",H({class:`${r}-skeleton`,style:i},s));return e>1?p(V,null,O(e,null).map(n=>[a,`
`])):a}});export{W as N};

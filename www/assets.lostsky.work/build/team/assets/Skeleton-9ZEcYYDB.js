import{d as N,c as v,a as j,u as E,h as w,j as H,z as b}from"./light-Ccjcu9At.js";import{r as O}from"./index-BJKaMiZy.js";import{i as V}from"./is-browser-DqcmxZSF.js";import{f as $,X as k,$ as A,F,d as y}from"./index--6Kpy4Zw.js";let S=!1;function L(){if(V&&window.CSS&&!S&&(S=!0,"registerProperty"in(window==null?void 0:window.CSS)))try{CSS.registerProperty({name:"--n-color-start",syntax:"<color>",inherits:!1,initialValue:"#0000"}),CSS.registerProperty({name:"--n-color-end",syntax:"<color>",inherits:!1,initialValue:"#0000"})}catch{}}function T(e){const{heightSmall:i,heightMedium:o,heightLarge:a,borderRadius:s}=e;return{color:"#eee",colorEnd:"#ddd",borderRadius:s,heightSmall:i,heightMedium:o,heightLarge:a}}const I={common:N,self:T},K=v([j("skeleton",`
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
 `)]),M=Object.assign(Object.assign({},w.props),{text:Boolean,round:Boolean,circle:Boolean,height:[String,Number],width:[String,Number],size:String,repeat:{type:Number,default:1},animated:{type:Boolean,default:!0},sharp:{type:Boolean,default:!0}}),G=$({name:"Skeleton",inheritAttrs:!1,props:M,setup(e){L();const{mergedClsPrefixRef:i,mergedComponentPropsRef:o}=E(e),a=y(()=>{var r,t;return e.size||((t=(r=o==null?void 0:o.value)===null||r===void 0?void 0:r.Skeleton)===null||t===void 0?void 0:t.size)}),s=w("Skeleton","-skeleton",K,I,e,i);return{mergedClsPrefix:i,style:y(()=>{var r,t;const g=s.value,{common:{cubicBezierEaseInOut:z}}=g,h=g.self,{color:x,colorEnd:C,borderRadius:P}=h;let l;const{circle:d,sharp:B,round:R,width:n,height:c,text:f,animated:_}=e,p=a.value;p!==void 0&&(l=h[H("height",p)]);const u=d?(r=n??c)!==null&&r!==void 0?r:l:n,m=(t=d?n??c:c)!==null&&t!==void 0?t:l;return{display:f?"inline-block":"",verticalAlign:f?"-0.125em":"",borderRadius:d?"50%":R?"4096px":B?"":P,width:typeof u=="number"?b(u):u,height:typeof m=="number"?b(m):m,animation:_?"":"none","--n-bezier":z,"--n-color-start":x,"--n-color-end":C}})}},render(){const{repeat:e,style:i,mergedClsPrefix:o,$attrs:a}=this,s=k("div",A({class:`${o}-skeleton`,style:i},a));return e>1?k(F,null,O(e,null).map(r=>[s,`
`])):s}});export{G as N};

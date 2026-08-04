import{cd as N,af as H,ax as v,ay as O,d as E,O as p,bz as F,ce as V,F as j,aF as A,aH as w,k,aS as L,br as y}from"./index-DetJed22.js";let S=!1;function T(){if(N&&window.CSS&&!S&&(S=!0,"registerProperty"in(window==null?void 0:window.CSS)))try{CSS.registerProperty({name:"--n-color-start",syntax:"<color>",inherits:!1,initialValue:"#0000"}),CSS.registerProperty({name:"--n-color-end",syntax:"<color>",inherits:!1,initialValue:"#0000"})}catch{}}function $(e){const{heightSmall:i,heightMedium:n,heightLarge:s,borderRadius:a}=e;return{color:"#eee",colorEnd:"#ddd",borderRadius:a,heightSmall:i,heightMedium:n,heightLarge:s}}const I={common:H,self:$},K=v([O("skeleton",`
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
 `)]),M=Object.assign(Object.assign({},w.props),{text:Boolean,round:Boolean,circle:Boolean,height:[String,Number],width:[String,Number],size:String,repeat:{type:Number,default:1},animated:{type:Boolean,default:!0},sharp:{type:Boolean,default:!0}}),q=E({name:"Skeleton",inheritAttrs:!1,props:M,setup(e){T();const{mergedClsPrefixRef:i,mergedComponentPropsRef:n}=A(e),s=k(()=>{var r,t;return e.size||((t=(r=n==null?void 0:n.value)===null||r===void 0?void 0:r.Skeleton)===null||t===void 0?void 0:t.size)}),a=w("Skeleton","-skeleton",K,I,e,i);return{mergedClsPrefix:i,style:k(()=>{var r,t;const m=a.value,{common:{cubicBezierEaseInOut:z}}=m,h=m.self,{color:x,colorEnd:C,borderRadius:P}=h;let l;const{circle:d,sharp:B,round:R,width:o,height:c,text:f,animated:_}=e,b=s.value;b!==void 0&&(l=h[L("height",b)]);const u=d?(r=o??c)!==null&&r!==void 0?r:l:o,g=(t=d?o??c:c)!==null&&t!==void 0?t:l;return{display:f?"inline-block":"",verticalAlign:f?"-0.125em":"",borderRadius:d?"50%":R?"4096px":B?"":P,width:typeof u=="number"?y(u):u,height:typeof g=="number"?y(g):g,animation:_?"":"none","--n-bezier":z,"--n-color-start":x,"--n-color-end":C}})}},render(){const{repeat:e,style:i,mergedClsPrefix:n,$attrs:s}=this,a=p("div",F({class:`${n}-skeleton`,style:i},s));return e>1?p(j,null,V(e,null).map(r=>[a,`
`])):a}});export{q as N};

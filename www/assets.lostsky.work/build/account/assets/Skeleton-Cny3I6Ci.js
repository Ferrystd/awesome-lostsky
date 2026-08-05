import{I as N,J as O,K as b,L as E,d as H,M as p,O as L,P as T,F as V,Q as j,S as w,k,T as A,U as S}from"./index-DhA42D5r.js";let y=!1;function F(){if(N&&window.CSS&&!y&&(y=!0,"registerProperty"in(window==null?void 0:window.CSS)))try{CSS.registerProperty({name:"--n-color-start",syntax:"<color>",inherits:!1,initialValue:"#0000"}),CSS.registerProperty({name:"--n-color-end",syntax:"<color>",inherits:!1,initialValue:"#0000"})}catch{}}function I(e){const{heightSmall:i,heightMedium:r,heightLarge:a,borderRadius:s}=e;return{color:"#eee",colorEnd:"#ddd",borderRadius:s,heightSmall:i,heightMedium:r,heightLarge:a}}const K={common:O,self:I},M=b([E("skeleton",`
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
 `)]),$=Object.assign(Object.assign({},w.props),{text:Boolean,round:Boolean,circle:Boolean,height:[String,Number],width:[String,Number],size:String,repeat:{type:Number,default:1},animated:{type:Boolean,default:!0},sharp:{type:Boolean,default:!0}}),Q=H({name:"Skeleton",inheritAttrs:!1,props:$,setup(e){F();const{mergedClsPrefixRef:i,mergedComponentPropsRef:r}=j(e),a=k(()=>{var n,t;return e.size||((t=(n=r==null?void 0:r.value)===null||n===void 0?void 0:n.Skeleton)===null||t===void 0?void 0:t.size)}),s=w("Skeleton","-skeleton",M,K,e,i);return{mergedClsPrefix:i,style:k(()=>{var n,t;const m=s.value,{common:{cubicBezierEaseInOut:z}}=m,h=m.self,{color:P,colorEnd:x,borderRadius:C}=h;let l;const{circle:d,sharp:B,round:R,width:o,height:c,text:f,animated:_}=e,v=a.value;v!==void 0&&(l=h[A("height",v)]);const u=d?(n=o??c)!==null&&n!==void 0?n:l:o,g=(t=d?o??c:c)!==null&&t!==void 0?t:l;return{display:f?"inline-block":"",verticalAlign:f?"-0.125em":"",borderRadius:d?"50%":R?"4096px":B?"":C,width:typeof u=="number"?S(u):u,height:typeof g=="number"?S(g):g,animation:_?"":"none","--n-bezier":z,"--n-color-start":P,"--n-color-end":x}})}},render(){const{repeat:e,style:i,mergedClsPrefix:r,$attrs:a}=this,s=p("div",L({class:`${r}-skeleton`,style:i},a));return e>1?p(V,null,T(e,null).map(n=>[s,`
`])):s}});export{Q as N};

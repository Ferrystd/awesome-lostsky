import{$ as S,a0 as h,l as _,d as m,b as i,a1 as z,c as M,i as W,f,s as g,o as r,a as N,j,t as u,a2 as D,a3 as P,a4 as U,a5 as q,a6 as E}from"./index-Dn8FhUT3.js";/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k=e=>e==="";/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const F=(...e)=>e.filter((t,o,a)=>!!t&&t.trim()!==""&&a.indexOf(t)===o).join(" ").trim();/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase();/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const O=e=>e.replace(/^([A-Z])|[\s-_]+(\w)/g,(t,o,a)=>a?a.toUpperCase():o.toLowerCase());/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Z=e=>{const t=O(e);return t.charAt(0).toUpperCase()+t.slice(1)};/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var n={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const T=({name:e,iconNode:t,"icon-node":o,absoluteStrokeWidth:a,"absolute-stroke-width":s,strokeWidth:w,"stroke-width":C,size:l,color:B,...$},{slots:p})=>{const{size:d,color:L,strokeWidth:x=2,absoluteStrokeWidth:I=!1,class:V=""}=S(),A=_(()=>{const c=k(a)||k(s)||a===!0||s===!0||I===!0,b=w||C||x||n["stroke-width"];return c?Number(b)*24/Number(l??d??n.width):b});return h("svg",{...n,...$,width:l??d??n.width,height:l??d??n.height,stroke:B??L??n.stroke,"stroke-width":A.value,class:F("lucide",V,...e?[`lucide-${y(Z(e))}-icon`,`lucide-${y(e)}`]:["lucide-icon"])},[...(t??o??[]).map(c=>h(...c)),...p.default?[p.default()]:[]])};/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const G=(e,t)=>(o,{slots:a,attrs:s})=>h(T,{...s,...o,iconNode:t,name:e},a.default?{default:a.default}:void 0);/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const H=[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]],J=G("loader-circle",H),K=["type","disabled","aria-busy"],Q=m({__name:"LsButton",props:{variant:{default:"primary"},size:{default:"md"},loading:{type:Boolean},disabled:{type:Boolean},type:{default:"button"}},setup(e){const t=e,o=_(()=>["ls-button",`ls-button--${t.variant}`,`ls-button--${t.size}`]);return(a,s)=>(r(),i("button",{type:e.type,class:z(o.value),disabled:e.disabled||e.loading,"aria-busy":e.loading||void 0},[e.loading?(r(),M(W(J),{key:0,size:18,class:"ls-button__spinner","aria-hidden":"true"})):f("",!0),g(a.$slots,"default",{},void 0)],10,K))}}),v=(e,t)=>{const o=e.__vccOpts||e;for(const[a,s]of t)o[a]=s;return o},ne=v(Q,[["__scopeId","data-v-bf286786"]]),R=["data-invalid"],X=["for"],Y={key:0,"aria-hidden":"true"},ee={key:0,class:"ls-field__error",role:"alert"},te={key:1,class:"ls-field__hint"},ae=m({__name:"LsField",props:{label:{},forId:{},error:{},hint:{},required:{type:Boolean}},setup(e){return(t,o)=>(r(),i("div",{class:"ls-field","data-invalid":!!e.error},[N("label",{for:e.forId},[j(u(e.label)+" ",1),e.required?(r(),i("span",Y,"*")):f("",!0)],8,X),g(t.$slots,"default",{invalid:!!e.error},void 0),e.error?(r(),i("p",ee,u(e.error),1)):e.hint?(r(),i("p",te,u(e.hint),1)):f("",!0)],8,R))}}),ie=v(ae,[["__scopeId","data-v-3dff7336"]]),oe=["aria-invalid"],se=m({inheritAttrs:!1,__name:"LsInput",props:E({invalid:{type:Boolean}},{modelValue:{},modelModifiers:{}}),emits:["update:modelValue"],setup(e){const t=D(e,"modelValue");return(o,a)=>P((r(),i("input",q({"onUpdate:modelValue":a[0]||(a[0]=s=>t.value=s),class:"ls-input","aria-invalid":e.invalid||void 0},o.$attrs),null,16,oe)),[[U,t.value]])}}),le=v(se,[["__scopeId","data-v-1b7f5ff3"]]);export{ie as L,v as _,le as a,ne as b,G as c};

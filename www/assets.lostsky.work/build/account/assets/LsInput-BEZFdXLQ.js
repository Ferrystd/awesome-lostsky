import{_ as S,$ as h,m as _,d as m,e as i,a0 as z,c as M,j as W,g as f,s as g,o as r,b as N,k as j,t as u,a1 as D,a2 as P,a3 as U,a4 as q,a5 as E}from"./index-NxMOQ5Fg.js";/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=e=>e==="";/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const F=(...e)=>e.filter((t,a,o)=>!!t&&t.trim()!==""&&o.indexOf(t)===a).join(" ").trim();/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase();/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const O=e=>e.replace(/^([A-Z])|[\s-_]+(\w)/g,(t,a,o)=>o?o.toUpperCase():a.toLowerCase());/**
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
 */const T=({name:e,iconNode:t,"icon-node":a,absoluteStrokeWidth:o,"absolute-stroke-width":s,strokeWidth:w,"stroke-width":C,size:l,color:B,...$},{slots:k})=>{const{size:d,color:L,strokeWidth:x=2,absoluteStrokeWidth:I=!1,class:V=""}=S(),A=_(()=>{const c=b(o)||b(s)||o===!0||s===!0||I===!0,p=w||C||x||n["stroke-width"];return c?Number(p)*24/Number(l??d??n.width):p});return h("svg",{...n,...$,width:l??d??n.width,height:l??d??n.height,stroke:B??L??n.stroke,"stroke-width":A.value,class:F("lucide",V,...e?[`lucide-${y(Z(e))}-icon`,`lucide-${y(e)}`]:["lucide-icon"])},[...(t??a??[]).map(c=>h(...c)),...k.default?[k.default()]:[]])};/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const G=(e,t)=>(a,{slots:o,attrs:s})=>h(T,{...s,...a,iconNode:t,name:e},o.default?{default:o.default}:void 0);/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const H=[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]],J=G("loader-circle",H),K=["type","disabled","aria-busy"],Q=m({__name:"LsButton",props:{variant:{default:"primary"},size:{default:"md"},loading:{type:Boolean},disabled:{type:Boolean},type:{default:"button"}},setup(e){const t=e,a=_(()=>["ls-button",`ls-button--${t.variant}`,`ls-button--${t.size}`]);return(o,s)=>(r(),i("button",{type:e.type,class:z(a.value),disabled:e.disabled||e.loading,"aria-busy":e.loading||void 0},[e.loading?(r(),M(W(J),{key:0,size:18,class:"ls-button__spinner","aria-hidden":"true"})):f("",!0),g(o.$slots,"default",{},void 0)],10,K))}}),v=(e,t)=>{const a=e.__vccOpts||e;for(const[o,s]of t)a[o]=s;return a},ne=v(Q,[["__scopeId","data-v-bf286786"]]),R=["data-invalid"],X=["for"],Y={key:0,"aria-hidden":"true"},ee={key:0,class:"ls-field__error",role:"alert"},te={key:1,class:"ls-field__hint"},oe=m({__name:"LsField",props:{label:{},forId:{},error:{},hint:{},required:{type:Boolean}},setup(e){return(t,a)=>(r(),i("div",{class:"ls-field","data-invalid":!!e.error},[N("label",{for:e.forId},[j(u(e.label)+" ",1),e.required?(r(),i("span",Y,"*")):f("",!0)],8,X),g(t.$slots,"default",{invalid:!!e.error},void 0),e.error?(r(),i("p",ee,u(e.error),1)):e.hint?(r(),i("p",te,u(e.hint),1)):f("",!0)],8,R))}}),ie=v(oe,[["__scopeId","data-v-3dff7336"]]),ae=["aria-invalid"],se=m({inheritAttrs:!1,__name:"LsInput",props:E({invalid:{type:Boolean}},{modelValue:{},modelModifiers:{}}),emits:["update:modelValue"],setup(e){const t=D(e,"modelValue");return(a,o)=>P((r(),i("input",q({"onUpdate:modelValue":o[0]||(o[0]=s=>t.value=s),class:"ls-input","aria-invalid":e.invalid||void 0},a.$attrs),null,16,ae)),[[U,t.value]])}}),le=v(se,[["__scopeId","data-v-1b7f5ff3"]]);export{ie as L,v as _,le as a,ne as b,G as c};

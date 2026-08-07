import{aQ as b,E as d,k as S}from"./index-Baw2rf90.js";/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=t=>t==="";/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const W=(...t)=>t.filter((e,r,o)=>!!e&&e.trim()!==""&&o.indexOf(e)===r).join(" ").trim();/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w=t=>t.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase();/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=t=>t.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,r,o)=>o?o.toUpperCase():r.toLowerCase());/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $=t=>{const e=L(t);return e.charAt(0).toUpperCase()+e.slice(1)};/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var s={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=({name:t,iconNode:e,"icon-node":r,absoluteStrokeWidth:o,"absolute-stroke-width":i,strokeWidth:k,"stroke-width":p,size:c,color:f,...C},{slots:l})=>{const{size:n,color:m,strokeWidth:g=2,absoluteStrokeWidth:x=!1,class:v=""}=b(),A=S(()=>{const a=h(o)||h(i)||o===!0||i===!0||x===!0,u=k||p||g||s["stroke-width"];return a?Number(u)*24/Number(c??n??s.width):u});return d("svg",{...s,...C,width:c??n??s.width,height:c??n??s.height,stroke:f??m??s.stroke,"stroke-width":A.value,class:W("lucide",v,...t?[`lucide-${w($(t))}-icon`,`lucide-${w(t)}`]:["lucide-icon"])},[...(e??r??[]).map(a=>d(...a)),...l.default?[l.default()]:[]])};/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const E=(t,e)=>(r,{slots:o,attrs:i})=>d(j,{...i,...r,iconNode:e,name:t},o.default?{default:o.default}:void 0);export{E as c};

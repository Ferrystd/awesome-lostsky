import{cl as b,M as l,k as S}from"./index-DlzBCCfC.js";/**
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
 */const j=({name:t,iconNode:e,"icon-node":r,absoluteStrokeWidth:o,"absolute-stroke-width":c,strokeWidth:k,"stroke-width":p,size:i,color:f,...C},{slots:d})=>{const{size:n,color:m,strokeWidth:g=2,absoluteStrokeWidth:x=!1,class:v=""}=b(),A=S(()=>{const a=h(o)||h(c)||o===!0||c===!0||x===!0,u=k||p||g||s["stroke-width"];return a?Number(u)*24/Number(i??n??s.width):u});return l("svg",{...s,...C,width:i??n??s.width,height:i??n??s.height,stroke:f??m??s.stroke,"stroke-width":A.value,class:W("lucide",v,...t?[`lucide-${w($(t))}-icon`,`lucide-${w(t)}`]:["lucide-icon"])},[...(e??r??[]).map(a=>l(...a)),...d.default?[d.default()]:[]])};/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const I=(t,e)=>(r,{slots:o,attrs:c})=>l(j,{...c,...r,iconNode:e,name:t},o.default?{default:o.default}:void 0);export{I as c};

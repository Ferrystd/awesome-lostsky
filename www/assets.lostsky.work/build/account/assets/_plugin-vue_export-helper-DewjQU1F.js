import{aR as _,h as l,w as b}from"./index-Ck0lmoq7.js";/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=t=>t==="";/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const S=(...t)=>t.filter((e,r,o)=>!!e&&e.trim()!==""&&o.indexOf(e)===r).join(" ").trim();/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w=t=>t.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase();/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const W=t=>t.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,r,o)=>o?o.toUpperCase():r.toLowerCase());/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=t=>{const e=W(t);return e.charAt(0).toUpperCase()+e.slice(1)};/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var c={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $=({name:t,iconNode:e,"icon-node":r,absoluteStrokeWidth:o,"absolute-stroke-width":s,strokeWidth:k,"stroke-width":p,size:i,color:f,...C},{slots:u})=>{const{size:n,color:g,strokeWidth:m=2,absoluteStrokeWidth:x=!1,class:v=""}=_(),A=b(()=>{const a=h(o)||h(s)||o===!0||s===!0||x===!0,d=k||p||m||c["stroke-width"];return a?Number(d)*24/Number(i??n??c.width):d});return l("svg",{...c,...C,width:i??n??c.width,height:i??n??c.height,stroke:f??g??c.stroke,"stroke-width":A.value,class:S("lucide",v,...t?[`lucide-${w(L(t))}-icon`,`lucide-${w(t)}`]:["lucide-icon"])},[...(e??r??[]).map(a=>l(...a)),...u.default?[u.default()]:[]])};/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=(t,e)=>(r,{slots:o,attrs:s})=>l($,{...s,...r,iconNode:e,name:t},o.default?{default:o.default}:void 0),B=(t,e)=>{const r=t.__vccOpts||t;for(const[o,s]of e)r[o]=s;return r};export{B as _,y as c};

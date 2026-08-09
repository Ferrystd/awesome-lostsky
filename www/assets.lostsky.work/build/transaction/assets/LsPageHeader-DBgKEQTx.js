import{c as d,d as i,y as u,o as a,a as s,g as k,w as h,b as _,u as m,e as p,t as o,j as c,i as n,N as r,_ as f}from"./index-Cc2RDGAd.js";/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]],L=d("arrow-left",b),g={class:"ls-page-header"},y={key:0},v={key:0,class:"ls-page-header__actions"},N=i({__name:"LsPageHeader",props:{title:{},description:{},backTo:{},backLabel:{}},setup(e){return(t,w)=>{const l=u("RouterLink");return a(),s("div",g,[e.backTo?(a(),k(l,{key:0,class:"ls-page-header__back",to:e.backTo},{default:h(()=>[_(m(L),{size:18}),p(o(e.backLabel||"返回"),1)]),_:1},8,["to"])):c("",!0),n("header",null,[n("div",null,[n("h1",null,o(e.title),1),e.description?(a(),s("p",y,o(e.description),1)):c("",!0)]),t.$slots.actions||t.$slots.default?(a(),s("div",v,[r(t.$slots,"actions",{},()=>[r(t.$slots,"default",{},void 0,!0)],!0)])):c("",!0)])])}}}),C=f(N,[["__scopeId","data-v-26803240"]]);export{C as L};

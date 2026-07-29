import{d as n,b as d,U as l,c,h as i,e as r,q as u,k as b,o as t}from"./index-DENb82WC.js";import{c as m,_ as p}from"./_plugin-vue_export-helper-COMErIrK.js";/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]],y=m("loader-circle",f),B=["type","disabled","aria-busy"],k=n({__name:"LsButton",props:{variant:{default:"primary"},size:{default:"md"},loading:{type:Boolean},disabled:{type:Boolean},type:{default:"button"}},setup(e){const a=e,s=b(()=>["ls-button",`ls-button--${a.variant}`,`ls-button--${a.size}`]);return(o,v)=>(t(),d("button",{type:e.type,class:l(s.value),disabled:e.disabled||e.loading,"aria-busy":e.loading||void 0},[e.loading?(t(),c(i(y),{key:0,size:18,class:"ls-button__spinner","aria-hidden":"true"})):r("",!0),u(o.$slots,"default",{},void 0)],10,B))}}),z=p(k,[["__scopeId","data-v-bf286786"]]);export{z as L,y as a};

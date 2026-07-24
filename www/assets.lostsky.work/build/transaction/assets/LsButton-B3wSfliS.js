import{c as n,d,a as l,q as i,f as c,u as r,g as u,a5 as m,j as b,o as t}from"./index-BVNdna3d.js";import{f}from"./_plugin-vue_export-helper-DSugVdDF.js";/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]],y=n("loader-circle",p),B=["type","disabled","aria-busy"],v=d({__name:"LsButton",props:{variant:{default:"primary"},size:{default:"md"},loading:{type:Boolean},disabled:{type:Boolean},type:{default:"button"}},setup(e){const a=e,o=b(()=>["ls-button",`ls-button--${a.variant}`,`ls-button--${a.size}`]);return(s,g)=>(t(),l("button",{type:e.type,class:i(o.value),disabled:e.disabled||e.loading,"aria-busy":e.loading||void 0},[e.loading?(t(),c(r(y),{key:0,size:18,class:"ls-button__spinner","aria-hidden":"true"})):u("",!0),m(s.$slots,"default",{},void 0,!0)],10,B))}}),L=f(v,[["__scopeId","data-v-bf286786"]]);export{L};

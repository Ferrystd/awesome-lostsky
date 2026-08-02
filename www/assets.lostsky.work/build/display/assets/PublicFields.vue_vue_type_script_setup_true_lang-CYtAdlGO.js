import{m,d as i,c as s,F as _,r as h,g as l,o as a,f as p,j as f,e as u,u as n,a as r,t as o,R as y,n as k}from"./index-DFJAidT6.js";import{a as v}from"./lib-a1zjhBXG.js";/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]],x=m("arrow-right",g);/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z=[["path",{d:"M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",key:"1oefj6"}],["path",{d:"M14 2v5a1 1 0 0 0 1 1h5",key:"wfsgrz"}],["path",{d:"M10 9H8",key:"b1mrlr"}],["path",{d:"M16 13H8",key:"t4e002"}],["path",{d:"M16 17H8",key:"z1uh3a"}]],b=m("file-text",z),M={key:0,class:"document-list"},L=i({__name:"DocumentList",props:{documents:{}},setup(t){return(c,d)=>t.documents.length?(a(),s("div",M,[(a(!0),s(_,null,h(t.documents,e=>(a(),p(n(y),{key:e.id,to:`/document/${e.id}`},{default:f(()=>[u(n(b),{size:20,"aria-hidden":"true"}),r("span",null,[r("strong",null,o(e.title),1),r("small",null,"更新于 "+o(new Date(e.update_time*1e3).toLocaleDateString("zh-CN")),1)]),u(n(x),{size:18,"aria-hidden":"true"})]),_:2},1032,["to"]))),128))])):l("",!0)}}),$={key:0,class:"profile-media"},N=["src","aria-label"],B=i({__name:"ProfileMedia",props:{profile:{}},setup(t){return(c,d)=>t.profile.intro_video?(a(),s("div",$,[r("video",{src:t.profile.intro_video,controls:"",playsinline:"",preload:"metadata","aria-label":`${t.profile.name} 的介绍视频`},null,8,N)])):l("",!0)}}),w={key:0,class:"public-fields"},D=i({__name:"PublicFields",props:{fields:{}},setup(t){return(c,d)=>t.fields.length?(a(),s("dl",w,[(a(!0),s(_,null,h(t.fields,e=>(a(),s("div",{key:e.key},[r("dt",null,o(e.name),1),r("dd",{class:k({"pre-value":e.value_type==="json"||e.value_type==="text"})},o(n(v)(e)),3)]))),128))])):l("",!0)}});export{x as A,D as _,B as a,L as b};

import{L as Z}from"./LsInlineError-s3jzG2zn.js";import{c as Q,d as R,J as r,aE as F,k as y,aF as E,aG as X,aH as H,aI as Y,aJ as _,aK as S,E as z,G as u,I as k,K as ee,L as J,M as re,aL as te,V,a as W,b as O,h as j,u as N,g as I,f as q,B as ie,n as oe,i as G,e as le,t as T,q as M,aw as ae,o as B,_ as K,aM as ne,aN as U}from"./index-BnnODiGY.js";import{N as se}from"./Input-C5ONidlg.js";/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const de=[["path",{d:"M12 3v12",key:"1x0j5s"}],["path",{d:"m17 8-5-5-5 5",key:"7q97r8"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}]],ce=Q("upload",de),ue={success:r(Y,null),error:r(H,null),warning:r(X,null),info:r(E,null)},ge=R({name:"ProgressCircle",props:{clsPrefix:{type:String,required:!0},status:{type:String,required:!0},strokeWidth:{type:Number,required:!0},fillColor:[String,Object],railColor:String,railStyle:[String,Object],percentage:{type:Number,default:0},offsetDegree:{type:Number,default:0},showIndicator:{type:Boolean,required:!0},indicatorTextColor:String,unit:String,viewBoxWidth:{type:Number,required:!0},gapDegree:{type:Number,required:!0},gapOffsetDegree:{type:Number,default:0}},setup(e,{slots:h}){const s=y(()=>{const i="gradient",{fillColor:t}=e;return typeof t=="object"?`${i}-${_(JSON.stringify(t))}`:i});function g(i,t,o,d){const{gapDegree:f,viewBoxWidth:p,strokeWidth:b}=e,a=50,m=0,c=a,l=0,x=2*a,$=50+b/2,v=`M ${$},${$} m ${m},${c}
      a ${a},${a} 0 1 1 ${l},${-x}
      a ${a},${a} 0 1 1 ${-l},${x}`,C=Math.PI*2*a,w={stroke:d==="rail"?o:typeof e.fillColor=="object"?`url(#${s.value})`:o,strokeDasharray:`${Math.min(i,100)/100*(C-f)}px ${p*8}px`,strokeDashoffset:`-${f/2}px`,transformOrigin:t?"center":void 0,transform:t?`rotate(${t}deg)`:void 0};return{pathString:v,pathStyle:w}}const n=()=>{const i=typeof e.fillColor=="object",t=i?e.fillColor.stops[0]:"",o=i?e.fillColor.stops[1]:"";return i&&r("defs",null,r("linearGradient",{id:s.value,x1:"0%",y1:"100%",x2:"100%",y2:"0%"},r("stop",{offset:"0%","stop-color":t}),r("stop",{offset:"100%","stop-color":o})))};return()=>{const{fillColor:i,railColor:t,strokeWidth:o,offsetDegree:d,status:f,percentage:p,showIndicator:b,indicatorTextColor:a,unit:m,gapOffsetDegree:c,clsPrefix:l}=e,{pathString:x,pathStyle:$}=g(100,0,t,"rail"),{pathString:v,pathStyle:C}=g(p,d,i,"fill"),w=100+o;return r("div",{class:`${l}-progress-content`,role:"none"},r("div",{class:`${l}-progress-graph`,"aria-hidden":!0},r("div",{class:`${l}-progress-graph-circle`,style:{transform:c?`rotate(${c}deg)`:void 0}},r("svg",{viewBox:`0 0 ${w} ${w}`},n(),r("g",null,r("path",{class:`${l}-progress-graph-circle-rail`,d:x,"stroke-width":o,"stroke-linecap":"round",fill:"none",style:$})),r("g",null,r("path",{class:[`${l}-progress-graph-circle-fill`,p===0&&`${l}-progress-graph-circle-fill--empty`],d:v,"stroke-width":o,"stroke-linecap":"round",fill:"none",style:C}))))),b?r("div",null,h.default?r("div",{class:`${l}-progress-custom-content`,role:"none"},h.default()):f!=="default"?r("div",{class:`${l}-progress-icon`,"aria-hidden":!0},r(F,{clsPrefix:l},{default:()=>ue[f]})):r("div",{class:`${l}-progress-text`,style:{color:a},role:"none"},r("span",{class:`${l}-progress-text__percentage`},p),r("span",{class:`${l}-progress-text__unit`},m))):null)}}}),fe={success:r(Y,null),error:r(H,null),warning:r(X,null),info:r(E,null)},pe=R({name:"ProgressLine",props:{clsPrefix:{type:String,required:!0},percentage:{type:Number,default:0},railColor:String,railStyle:[String,Object],fillColor:[String,Object],status:{type:String,required:!0},indicatorPlacement:{type:String,required:!0},indicatorTextColor:String,unit:{type:String,default:"%"},processing:{type:Boolean,required:!0},showIndicator:{type:Boolean,required:!0},height:[String,Number],railBorderRadius:[String,Number],fillBorderRadius:[String,Number]},setup(e,{slots:h}){const s=y(()=>S(e.height)),g=y(()=>{var t,o;return typeof e.fillColor=="object"?`linear-gradient(to right, ${(t=e.fillColor)===null||t===void 0?void 0:t.stops[0]} , ${(o=e.fillColor)===null||o===void 0?void 0:o.stops[1]})`:e.fillColor}),n=y(()=>e.railBorderRadius!==void 0?S(e.railBorderRadius):e.height!==void 0?S(e.height,{c:.5}):""),i=y(()=>e.fillBorderRadius!==void 0?S(e.fillBorderRadius):e.railBorderRadius!==void 0?S(e.railBorderRadius):e.height!==void 0?S(e.height,{c:.5}):"");return()=>{const{indicatorPlacement:t,railColor:o,railStyle:d,percentage:f,unit:p,indicatorTextColor:b,status:a,showIndicator:m,processing:c,clsPrefix:l}=e;return r("div",{class:`${l}-progress-content`,role:"none"},r("div",{class:`${l}-progress-graph`,"aria-hidden":!0},r("div",{class:[`${l}-progress-graph-line`,{[`${l}-progress-graph-line--indicator-${t}`]:!0}]},r("div",{class:`${l}-progress-graph-line-rail`,style:[{backgroundColor:o,height:s.value,borderRadius:n.value},d]},r("div",{class:[`${l}-progress-graph-line-fill`,c&&`${l}-progress-graph-line-fill--processing`],style:{maxWidth:`${e.percentage}%`,background:g.value,height:s.value,lineHeight:s.value,borderRadius:i.value}},t==="inside"?r("div",{class:`${l}-progress-graph-line-indicator`,style:{color:b}},h.default?h.default():`${f}${p}`):null)))),m&&t==="outside"?r("div",null,h.default?r("div",{class:`${l}-progress-custom-content`,style:{color:b},role:"none"},h.default()):a==="default"?r("div",{role:"none",class:`${l}-progress-icon ${l}-progress-icon--as-text`,style:{color:b}},f,p):r("div",{class:`${l}-progress-icon`,"aria-hidden":!0},r(F,{clsPrefix:l},{default:()=>fe[a]}))):null)}}});function A(e,h,s=100){return`m ${s/2} ${s/2-e} a ${e} ${e} 0 1 1 0 ${2*e} a ${e} ${e} 0 1 1 0 -${2*e}`}const he=R({name:"ProgressMultipleCircle",props:{clsPrefix:{type:String,required:!0},viewBoxWidth:{type:Number,required:!0},percentage:{type:Array,default:[0]},strokeWidth:{type:Number,required:!0},circleGap:{type:Number,required:!0},showIndicator:{type:Boolean,required:!0},fillColor:{type:Array,default:()=>[]},railColor:{type:Array,default:()=>[]},railStyle:{type:Array,default:()=>[]}},setup(e,{slots:h}){const s=y(()=>e.percentage.map((i,t)=>`${Math.PI*i/100*(e.viewBoxWidth/2-e.strokeWidth/2*(1+2*t)-e.circleGap*t)*2}, ${e.viewBoxWidth*8}`)),g=(n,i)=>{const t=e.fillColor[i],o=typeof t=="object"?t.stops[0]:"",d=typeof t=="object"?t.stops[1]:"";return typeof e.fillColor[i]=="object"&&r("linearGradient",{id:`gradient-${i}`,x1:"100%",y1:"0%",x2:"0%",y2:"100%"},r("stop",{offset:"0%","stop-color":o}),r("stop",{offset:"100%","stop-color":d}))};return()=>{const{viewBoxWidth:n,strokeWidth:i,circleGap:t,showIndicator:o,fillColor:d,railColor:f,railStyle:p,percentage:b,clsPrefix:a}=e;return r("div",{class:`${a}-progress-content`,role:"none"},r("div",{class:`${a}-progress-graph`,"aria-hidden":!0},r("div",{class:`${a}-progress-graph-circle`},r("svg",{viewBox:`0 0 ${n} ${n}`},r("defs",null,b.map((m,c)=>g(m,c))),b.map((m,c)=>r("g",{key:c},r("path",{class:`${a}-progress-graph-circle-rail`,d:A(n/2-i/2*(1+2*c)-t*c,i,n),"stroke-width":i,"stroke-linecap":"round",fill:"none",style:[{strokeDashoffset:0,stroke:f[c]},p[c]]}),r("path",{class:[`${a}-progress-graph-circle-fill`,m===0&&`${a}-progress-graph-circle-fill--empty`],d:A(n/2-i/2*(1+2*c)-t*c,i,n),"stroke-width":i,"stroke-linecap":"round",fill:"none",style:{strokeDasharray:s.value[c],strokeDashoffset:0,stroke:typeof d[c]=="object"?`url(#gradient-${c})`:d[c]}})))))),o&&h.default?r("div",null,r("div",{class:`${a}-progress-text`},h.default())):null)}}}),be=z([u("progress",{display:"inline-block"},[u("progress-icon",`
 color: var(--n-icon-color);
 transition: color .3s var(--n-bezier);
 `),k("line",`
 width: 100%;
 display: block;
 `,[u("progress-content",`
 display: flex;
 align-items: center;
 `,[u("progress-graph",{flex:1})]),u("progress-custom-content",{marginLeft:"14px"}),u("progress-icon",`
 width: 30px;
 padding-left: 14px;
 height: var(--n-icon-size-line);
 line-height: var(--n-icon-size-line);
 font-size: var(--n-icon-size-line);
 `,[k("as-text",`
 color: var(--n-text-color-line-outer);
 text-align: center;
 width: 40px;
 font-size: var(--n-font-size);
 padding-left: 4px;
 transition: color .3s var(--n-bezier);
 `)])]),k("circle, dashboard",{width:"120px"},[u("progress-custom-content",`
 position: absolute;
 left: 50%;
 top: 50%;
 transform: translateX(-50%) translateY(-50%);
 display: flex;
 align-items: center;
 justify-content: center;
 `),u("progress-text",`
 position: absolute;
 left: 50%;
 top: 50%;
 transform: translateX(-50%) translateY(-50%);
 display: flex;
 align-items: center;
 color: inherit;
 font-size: var(--n-font-size-circle);
 color: var(--n-text-color-circle);
 font-weight: var(--n-font-weight-circle);
 transition: color .3s var(--n-bezier);
 white-space: nowrap;
 `),u("progress-icon",`
 position: absolute;
 left: 50%;
 top: 50%;
 transform: translateX(-50%) translateY(-50%);
 display: flex;
 align-items: center;
 color: var(--n-icon-color);
 font-size: var(--n-icon-size-circle);
 `)]),k("multiple-circle",`
 width: 200px;
 color: inherit;
 `,[u("progress-text",`
 font-weight: var(--n-font-weight-circle);
 color: var(--n-text-color-circle);
 position: absolute;
 left: 50%;
 top: 50%;
 transform: translateX(-50%) translateY(-50%);
 display: flex;
 align-items: center;
 justify-content: center;
 transition: color .3s var(--n-bezier);
 `)]),u("progress-content",{position:"relative"}),u("progress-graph",{position:"relative"},[u("progress-graph-circle",[z("svg",{verticalAlign:"bottom"}),u("progress-graph-circle-fill",`
 stroke: var(--n-fill-color);
 transition:
 opacity .3s var(--n-bezier),
 stroke .3s var(--n-bezier),
 stroke-dasharray .3s var(--n-bezier);
 `,[k("empty",{opacity:0})]),u("progress-graph-circle-rail",`
 transition: stroke .3s var(--n-bezier);
 overflow: hidden;
 stroke: var(--n-rail-color);
 `)]),u("progress-graph-line",[k("indicator-inside",[u("progress-graph-line-rail",`
 height: 16px;
 line-height: 16px;
 border-radius: 10px;
 `,[u("progress-graph-line-fill",`
 height: inherit;
 border-radius: 10px;
 `),u("progress-graph-line-indicator",`
 background: #0000;
 white-space: nowrap;
 text-align: right;
 margin-left: 14px;
 margin-right: 14px;
 height: inherit;
 font-size: 12px;
 color: var(--n-text-color-line-inner);
 transition: color .3s var(--n-bezier);
 `)])]),k("indicator-inside-label",`
 height: 16px;
 display: flex;
 align-items: center;
 `,[u("progress-graph-line-rail",`
 flex: 1;
 transition: background-color .3s var(--n-bezier);
 `),u("progress-graph-line-indicator",`
 background: var(--n-fill-color);
 font-size: 12px;
 transform: translateZ(0);
 display: flex;
 vertical-align: middle;
 height: 16px;
 line-height: 16px;
 padding: 0 10px;
 border-radius: 10px;
 position: absolute;
 white-space: nowrap;
 color: var(--n-text-color-line-inner);
 transition:
 right .2s var(--n-bezier),
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 `)]),u("progress-graph-line-rail",`
 position: relative;
 overflow: hidden;
 height: var(--n-rail-height);
 border-radius: 5px;
 background-color: var(--n-rail-color);
 transition: background-color .3s var(--n-bezier);
 `,[u("progress-graph-line-fill",`
 background: var(--n-fill-color);
 position: relative;
 border-radius: 5px;
 height: inherit;
 width: 100%;
 max-width: 0%;
 transition:
 background-color .3s var(--n-bezier),
 max-width .2s var(--n-bezier);
 `,[k("processing",[z("&::after",`
 content: "";
 background-image: var(--n-line-bg-processing);
 animation: progress-processing-animation 2s var(--n-bezier) infinite;
 `)])])])])])]),z("@keyframes progress-processing-animation",`
 0% {
 position: absolute;
 left: 0;
 top: 0;
 bottom: 0;
 right: 100%;
 opacity: 1;
 }
 66% {
 position: absolute;
 left: 0;
 top: 0;
 bottom: 0;
 right: 0;
 opacity: 0;
 }
 100% {
 position: absolute;
 left: 0;
 top: 0;
 bottom: 0;
 right: 0;
 opacity: 0;
 }
 `)]),me=Object.assign(Object.assign({},J.props),{processing:Boolean,type:{type:String,default:"line"},gapDegree:Number,gapOffsetDegree:Number,status:{type:String,default:"default"},railColor:[String,Array],railStyle:[String,Array],color:[String,Array,Object],viewBoxWidth:{type:Number,default:100},strokeWidth:{type:Number,default:7},percentage:[Number,Array],unit:{type:String,default:"%"},showIndicator:{type:Boolean,default:!0},indicatorPosition:{type:String,default:"outside"},indicatorPlacement:{type:String,default:"outside"},indicatorTextColor:String,circleGap:{type:Number,default:1},height:Number,borderRadius:[String,Number],fillBorderRadius:[String,Number],offsetDegree:Number}),ve=R({name:"Progress",props:me,setup(e){const h=y(()=>e.indicatorPlacement||e.indicatorPosition),s=y(()=>{if(e.gapDegree||e.gapDegree===0)return e.gapDegree;if(e.type==="dashboard")return 75}),{mergedClsPrefixRef:g,inlineThemeDisabled:n}=ee(e),i=J("Progress","-progress",be,te,e,g),t=y(()=>{const{status:d}=e,{common:{cubicBezierEaseInOut:f},self:{fontSize:p,fontSizeCircle:b,railColor:a,railHeight:m,iconSizeCircle:c,iconSizeLine:l,textColorCircle:x,textColorLineInner:$,textColorLineOuter:v,lineBgProcessing:C,fontWeightCircle:w,[V("iconColor",d)]:D,[V("fillColor",d)]:P}}=i.value;return{"--n-bezier":f,"--n-fill-color":P,"--n-font-size":p,"--n-font-size-circle":b,"--n-font-weight-circle":w,"--n-icon-color":D,"--n-icon-size-circle":c,"--n-icon-size-line":l,"--n-line-bg-processing":C,"--n-rail-color":a,"--n-rail-height":m,"--n-text-color-circle":x,"--n-text-color-line-inner":$,"--n-text-color-line-outer":v}}),o=n?re("progress",y(()=>e.status[0]),t,e):void 0;return{mergedClsPrefix:g,mergedIndicatorPlacement:h,gapDeg:s,cssVars:n?void 0:t,themeClass:o==null?void 0:o.themeClass,onRender:o==null?void 0:o.onRender}},render(){const{type:e,cssVars:h,indicatorTextColor:s,showIndicator:g,status:n,railColor:i,railStyle:t,color:o,percentage:d,viewBoxWidth:f,strokeWidth:p,mergedIndicatorPlacement:b,unit:a,borderRadius:m,fillBorderRadius:c,height:l,processing:x,circleGap:$,mergedClsPrefix:v,gapDeg:C,gapOffsetDegree:w,themeClass:D,$slots:P,onRender:L}=this;return L==null||L(),r("div",{class:[D,`${v}-progress`,`${v}-progress--${e}`,`${v}-progress--${n}`],style:h,"aria-valuemax":100,"aria-valuemin":0,"aria-valuenow":d,role:e==="circle"||e==="line"||e==="dashboard"?"progressbar":"none"},e==="circle"||e==="dashboard"?r(ge,{clsPrefix:v,status:n,showIndicator:g,indicatorTextColor:s,railColor:i,fillColor:o,railStyle:t,offsetDegree:this.offsetDegree,percentage:d,viewBoxWidth:f,strokeWidth:p,gapDegree:C===void 0?e==="dashboard"?75:0:C,gapOffsetDegree:w,unit:a},P):e==="line"?r(pe,{clsPrefix:v,status:n,showIndicator:g,indicatorTextColor:s,railColor:i,fillColor:o,railStyle:t,percentage:d,processing:x,indicatorPlacement:b,unit:a,fillBorderRadius:c,railBorderRadius:m,height:l},P):e==="multiple-circle"?r(he,{clsPrefix:v,strokeWidth:p,railColor:i,fillColor:o,railStyle:t,viewBoxWidth:f,percentage:d,showIndicator:g,circleGap:$},P):null)}}),ye={class:"ls-upload-field"},xe={class:"ls-upload-field__controls"},$e=["id","accept","multiple","disabled"],Ce={key:1,class:"ls-upload-field__reason"},we=R({__name:"LsUploadField",props:{modelValue:{default:""},id:{},placeholder:{default:"图片 URL 或选择文件"},buttonLabel:{default:"选择文件"},disabled:{type:Boolean},disabledReason:{default:""},loading:{type:Boolean},progress:{default:null},accept:{default:""},multiple:{type:Boolean,default:!1},showUrl:{type:Boolean,default:!0},showReason:{type:Boolean,default:!1}},emits:["update:modelValue","choose","change"],setup(e,{emit:h}){const s=e,g=h,n=M(null),i=y(()=>s.disabled&&!!s.disabledReason.trim());function t(){var o;if(s.disabled){i.value&&ae.info(s.disabledReason.trim());return}g("choose"),(o=n.value)==null||o.click()}return(o,d)=>(B(),W("div",ye,[O("div",xe,[e.showUrl?(B(),j(N(se),{key:0,value:e.modelValue,placeholder:e.placeholder,"input-props":e.id?{id:e.id}:void 0,"onUpdate:value":d[0]||(d[0]=f=>g("update:modelValue",f))},null,8,["value","placeholder","input-props"])):I("",!0),q(N(ie),{disabled:e.disabled&&!i.value,"aria-disabled":e.disabled||void 0,class:oe({"ls-upload-field__button--disabled":i.value}),loading:e.loading,title:e.disabledReason||void 0,onClick:t},{icon:G(()=>[q(N(ce),{size:18})]),default:G(()=>[le(T(e.buttonLabel),1)]),_:1},8,["disabled","aria-disabled","class","loading","title"]),O("input",{ref_key:"input",ref:n,id:e.id?`${e.id}-file`:void 0,class:"ls-upload-field__input",type:"file",accept:e.accept,multiple:e.multiple,disabled:e.disabled,onChange:d[1]||(d[1]=f=>g("change",f))},null,40,$e)]),e.progress!==null?(B(),j(N(ve),{key:0,type:"line",percentage:e.progress,"show-indicator":!0},null,8,["percentage"])):I("",!0),e.showReason&&e.disabled&&e.disabledReason?(B(),W("small",Ce,T(e.disabledReason),1)):I("",!0)]))}}),ke=K(we,[["__scopeId","data-v-17bc0fd2"]]),Se={class:"ls-media-upload-field"},Be=R({__name:"LsMediaUploadField",props:U({upload:{},id:{},accept:{default:""},placeholder:{default:"文件 URL 或选择文件"},buttonLabel:{default:"选择文件"},disabled:{type:Boolean,default:!1},disabledReason:{default:""},showReason:{type:Boolean,default:!1}},{modelValue:{default:""},modelModifiers:{}}),emits:U(["uploading","uploaded"],["update:modelValue"]),setup(e,{emit:h}){const s=ne(e,"modelValue"),g=e,n=h,i=M(!1),t=M(""),o=y(()=>i.value?"文件正在上传，请稍候":g.disabledReason);async function d(f){var a;const p=f.target,b=(a=p.files)==null?void 0:a[0];if(b){if(g.disabled||g.disabledReason){p.value="";return}i.value=!0,t.value="",n("uploading",!0);try{const m=await g.upload(b);s.value=m,n("uploaded",m)}catch(m){t.value=m instanceof Error?m.message:"文件上传失败，请稍后重试"}finally{i.value=!1,n("uploading",!1),p.value=""}}}return(f,p)=>(B(),W("div",Se,[q(ke,{id:e.id,modelValue:s.value,"onUpdate:modelValue":p[0]||(p[0]=b=>s.value=b),accept:e.accept,placeholder:e.placeholder,"button-label":e.buttonLabel,loading:i.value,disabled:e.disabled||i.value||!!e.disabledReason,"disabled-reason":o.value,"show-reason":e.showReason,onChange:d},null,8,["id","modelValue","accept","placeholder","button-label","loading","disabled","disabled-reason","show-reason"]),t.value?(B(),j(Z,{key:0,message:t.value},null,8,["message"])):I("",!0)]))}}),Ne=K(Be,[["__scopeId","data-v-40c5df5b"]]);export{Ne as L};

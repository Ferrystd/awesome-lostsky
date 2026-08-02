import{s as F,ac as J,d as z,O as r,aB as A,k as v,aR as U,aS as H,aT as X,aU as Y,aV as K,aW as w,av as P,aw as d,ax as k,aD as Q,aF as E,aH as Z,aQ as j,a as L,b as O,h as q,e as R,i as W,f as T,am as _,w as G,g as ee,t as V,G as re,o as N,_ as te}from"./index-BSvkHgpE.js";import{N as oe}from"./Input-DwwhmyCu.js";/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ie=[["path",{d:"M12 3v12",key:"1x0j5s"}],["path",{d:"m17 8-5-5-5 5",key:"7q97r8"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}]],le=F("upload",ie);function ne(e){const{infoColor:u,successColor:c,warningColor:f,errorColor:a,textColor2:o,progressRailColor:t,fontSize:i,fontWeight:g}=e;return{fontSize:i,fontSizeCircle:"28px",fontWeightCircle:g,railColor:t,railHeight:"8px",iconSizeCircle:"36px",iconSizeLine:"18px",iconColor:u,iconColorInfo:u,iconColorSuccess:c,iconColorWarning:f,iconColorError:a,textColorCircle:o,textColorLineInner:"rgb(255, 255, 255)",textColorLineOuter:o,fillColor:u,fillColorInfo:u,fillColorSuccess:c,fillColorWarning:f,fillColorError:a,lineBgProcessing:"linear-gradient(90deg, rgba(255, 255, 255, .3) 0%, rgba(255, 255, 255, .5) 100%)"}}const ae={common:J,self:ne},se={success:r(Y,null),error:r(X,null),warning:r(H,null),info:r(U,null)},ce=z({name:"ProgressCircle",props:{clsPrefix:{type:String,required:!0},status:{type:String,required:!0},strokeWidth:{type:Number,required:!0},fillColor:[String,Object],railColor:String,railStyle:[String,Object],percentage:{type:Number,default:0},offsetDegree:{type:Number,default:0},showIndicator:{type:Boolean,required:!0},indicatorTextColor:String,unit:String,viewBoxWidth:{type:Number,required:!0},gapDegree:{type:Number,required:!0},gapOffsetDegree:{type:Number,default:0}},setup(e,{slots:u}){const c=v(()=>{const o="gradient",{fillColor:t}=e;return typeof t=="object"?`${o}-${K(JSON.stringify(t))}`:o});function f(o,t,i,g){const{gapDegree:p,viewBoxWidth:h,strokeWidth:y}=e,n=50,m=0,s=n,l=0,x=2*n,C=50+y/2,b=`M ${C},${C} m ${m},${s}
      a ${n},${n} 0 1 1 ${l},${-x}
      a ${n},${n} 0 1 1 ${-l},${x}`,$=Math.PI*2*n,S={stroke:g==="rail"?i:typeof e.fillColor=="object"?`url(#${c.value})`:i,strokeDasharray:`${Math.min(o,100)/100*($-p)}px ${h*8}px`,strokeDashoffset:`-${p/2}px`,transformOrigin:t?"center":void 0,transform:t?`rotate(${t}deg)`:void 0};return{pathString:b,pathStyle:S}}const a=()=>{const o=typeof e.fillColor=="object",t=o?e.fillColor.stops[0]:"",i=o?e.fillColor.stops[1]:"";return o&&r("defs",null,r("linearGradient",{id:c.value,x1:"0%",y1:"100%",x2:"100%",y2:"0%"},r("stop",{offset:"0%","stop-color":t}),r("stop",{offset:"100%","stop-color":i})))};return()=>{const{fillColor:o,railColor:t,strokeWidth:i,offsetDegree:g,status:p,percentage:h,showIndicator:y,indicatorTextColor:n,unit:m,gapOffsetDegree:s,clsPrefix:l}=e,{pathString:x,pathStyle:C}=f(100,0,t,"rail"),{pathString:b,pathStyle:$}=f(h,g,o,"fill"),S=100+i;return r("div",{class:`${l}-progress-content`,role:"none"},r("div",{class:`${l}-progress-graph`,"aria-hidden":!0},r("div",{class:`${l}-progress-graph-circle`,style:{transform:s?`rotate(${s}deg)`:void 0}},r("svg",{viewBox:`0 0 ${S} ${S}`},a(),r("g",null,r("path",{class:`${l}-progress-graph-circle-rail`,d:x,"stroke-width":i,"stroke-linecap":"round",fill:"none",style:C})),r("g",null,r("path",{class:[`${l}-progress-graph-circle-fill`,h===0&&`${l}-progress-graph-circle-fill--empty`],d:b,"stroke-width":i,"stroke-linecap":"round",fill:"none",style:$}))))),y?r("div",null,u.default?r("div",{class:`${l}-progress-custom-content`,role:"none"},u.default()):p!=="default"?r("div",{class:`${l}-progress-icon`,"aria-hidden":!0},r(A,{clsPrefix:l},{default:()=>se[p]})):r("div",{class:`${l}-progress-text`,style:{color:n},role:"none"},r("span",{class:`${l}-progress-text__percentage`},h),r("span",{class:`${l}-progress-text__unit`},m))):null)}}}),de={success:r(Y,null),error:r(X,null),warning:r(H,null),info:r(U,null)},ue=z({name:"ProgressLine",props:{clsPrefix:{type:String,required:!0},percentage:{type:Number,default:0},railColor:String,railStyle:[String,Object],fillColor:[String,Object],status:{type:String,required:!0},indicatorPlacement:{type:String,required:!0},indicatorTextColor:String,unit:{type:String,default:"%"},processing:{type:Boolean,required:!0},showIndicator:{type:Boolean,required:!0},height:[String,Number],railBorderRadius:[String,Number],fillBorderRadius:[String,Number]},setup(e,{slots:u}){const c=v(()=>w(e.height)),f=v(()=>{var t,i;return typeof e.fillColor=="object"?`linear-gradient(to right, ${(t=e.fillColor)===null||t===void 0?void 0:t.stops[0]} , ${(i=e.fillColor)===null||i===void 0?void 0:i.stops[1]})`:e.fillColor}),a=v(()=>e.railBorderRadius!==void 0?w(e.railBorderRadius):e.height!==void 0?w(e.height,{c:.5}):""),o=v(()=>e.fillBorderRadius!==void 0?w(e.fillBorderRadius):e.railBorderRadius!==void 0?w(e.railBorderRadius):e.height!==void 0?w(e.height,{c:.5}):"");return()=>{const{indicatorPlacement:t,railColor:i,railStyle:g,percentage:p,unit:h,indicatorTextColor:y,status:n,showIndicator:m,processing:s,clsPrefix:l}=e;return r("div",{class:`${l}-progress-content`,role:"none"},r("div",{class:`${l}-progress-graph`,"aria-hidden":!0},r("div",{class:[`${l}-progress-graph-line`,{[`${l}-progress-graph-line--indicator-${t}`]:!0}]},r("div",{class:`${l}-progress-graph-line-rail`,style:[{backgroundColor:i,height:c.value,borderRadius:a.value},g]},r("div",{class:[`${l}-progress-graph-line-fill`,s&&`${l}-progress-graph-line-fill--processing`],style:{maxWidth:`${e.percentage}%`,background:f.value,height:c.value,lineHeight:c.value,borderRadius:o.value}},t==="inside"?r("div",{class:`${l}-progress-graph-line-indicator`,style:{color:y}},u.default?u.default():`${p}${h}`):null)))),m&&t==="outside"?r("div",null,u.default?r("div",{class:`${l}-progress-custom-content`,style:{color:y},role:"none"},u.default()):n==="default"?r("div",{role:"none",class:`${l}-progress-icon ${l}-progress-icon--as-text`,style:{color:y}},p,h):r("div",{class:`${l}-progress-icon`,"aria-hidden":!0},r(A,{clsPrefix:l},{default:()=>de[n]}))):null)}}});function M(e,u,c=100){return`m ${c/2} ${c/2-e} a ${e} ${e} 0 1 1 0 ${2*e} a ${e} ${e} 0 1 1 0 -${2*e}`}const ge=z({name:"ProgressMultipleCircle",props:{clsPrefix:{type:String,required:!0},viewBoxWidth:{type:Number,required:!0},percentage:{type:Array,default:[0]},strokeWidth:{type:Number,required:!0},circleGap:{type:Number,required:!0},showIndicator:{type:Boolean,required:!0},fillColor:{type:Array,default:()=>[]},railColor:{type:Array,default:()=>[]},railStyle:{type:Array,default:()=>[]}},setup(e,{slots:u}){const c=v(()=>e.percentage.map((o,t)=>`${Math.PI*o/100*(e.viewBoxWidth/2-e.strokeWidth/2*(1+2*t)-e.circleGap*t)*2}, ${e.viewBoxWidth*8}`)),f=(a,o)=>{const t=e.fillColor[o],i=typeof t=="object"?t.stops[0]:"",g=typeof t=="object"?t.stops[1]:"";return typeof e.fillColor[o]=="object"&&r("linearGradient",{id:`gradient-${o}`,x1:"100%",y1:"0%",x2:"0%",y2:"100%"},r("stop",{offset:"0%","stop-color":i}),r("stop",{offset:"100%","stop-color":g}))};return()=>{const{viewBoxWidth:a,strokeWidth:o,circleGap:t,showIndicator:i,fillColor:g,railColor:p,railStyle:h,percentage:y,clsPrefix:n}=e;return r("div",{class:`${n}-progress-content`,role:"none"},r("div",{class:`${n}-progress-graph`,"aria-hidden":!0},r("div",{class:`${n}-progress-graph-circle`},r("svg",{viewBox:`0 0 ${a} ${a}`},r("defs",null,y.map((m,s)=>f(m,s))),y.map((m,s)=>r("g",{key:s},r("path",{class:`${n}-progress-graph-circle-rail`,d:M(a/2-o/2*(1+2*s)-t*s,o,a),"stroke-width":o,"stroke-linecap":"round",fill:"none",style:[{strokeDashoffset:0,stroke:p[s]},h[s]]}),r("path",{class:[`${n}-progress-graph-circle-fill`,m===0&&`${n}-progress-graph-circle-fill--empty`],d:M(a/2-o/2*(1+2*s)-t*s,o,a),"stroke-width":o,"stroke-linecap":"round",fill:"none",style:{strokeDasharray:c.value[s],strokeDashoffset:0,stroke:typeof g[s]=="object"?`url(#gradient-${s})`:g[s]}})))))),i&&u.default?r("div",null,r("div",{class:`${n}-progress-text`},u.default())):null)}}}),fe=P([d("progress",{display:"inline-block"},[d("progress-icon",`
 color: var(--n-icon-color);
 transition: color .3s var(--n-bezier);
 `),k("line",`
 width: 100%;
 display: block;
 `,[d("progress-content",`
 display: flex;
 align-items: center;
 `,[d("progress-graph",{flex:1})]),d("progress-custom-content",{marginLeft:"14px"}),d("progress-icon",`
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
 `)])]),k("circle, dashboard",{width:"120px"},[d("progress-custom-content",`
 position: absolute;
 left: 50%;
 top: 50%;
 transform: translateX(-50%) translateY(-50%);
 display: flex;
 align-items: center;
 justify-content: center;
 `),d("progress-text",`
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
 `),d("progress-icon",`
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
 `,[d("progress-text",`
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
 `)]),d("progress-content",{position:"relative"}),d("progress-graph",{position:"relative"},[d("progress-graph-circle",[P("svg",{verticalAlign:"bottom"}),d("progress-graph-circle-fill",`
 stroke: var(--n-fill-color);
 transition:
 opacity .3s var(--n-bezier),
 stroke .3s var(--n-bezier),
 stroke-dasharray .3s var(--n-bezier);
 `,[k("empty",{opacity:0})]),d("progress-graph-circle-rail",`
 transition: stroke .3s var(--n-bezier);
 overflow: hidden;
 stroke: var(--n-rail-color);
 `)]),d("progress-graph-line",[k("indicator-inside",[d("progress-graph-line-rail",`
 height: 16px;
 line-height: 16px;
 border-radius: 10px;
 `,[d("progress-graph-line-fill",`
 height: inherit;
 border-radius: 10px;
 `),d("progress-graph-line-indicator",`
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
 `,[d("progress-graph-line-rail",`
 flex: 1;
 transition: background-color .3s var(--n-bezier);
 `),d("progress-graph-line-indicator",`
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
 `)]),d("progress-graph-line-rail",`
 position: relative;
 overflow: hidden;
 height: var(--n-rail-height);
 border-radius: 5px;
 background-color: var(--n-rail-color);
 transition: background-color .3s var(--n-bezier);
 `,[d("progress-graph-line-fill",`
 background: var(--n-fill-color);
 position: relative;
 border-radius: 5px;
 height: inherit;
 width: 100%;
 max-width: 0%;
 transition:
 background-color .3s var(--n-bezier),
 max-width .2s var(--n-bezier);
 `,[k("processing",[P("&::after",`
 content: "";
 background-image: var(--n-line-bg-processing);
 animation: progress-processing-animation 2s var(--n-bezier) infinite;
 `)])])])])])]),P("@keyframes progress-processing-animation",`
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
 `)]),pe=Object.assign(Object.assign({},E.props),{processing:Boolean,type:{type:String,default:"line"},gapDegree:Number,gapOffsetDegree:Number,status:{type:String,default:"default"},railColor:[String,Array],railStyle:[String,Array],color:[String,Array,Object],viewBoxWidth:{type:Number,default:100},strokeWidth:{type:Number,default:7},percentage:[Number,Array],unit:{type:String,default:"%"},showIndicator:{type:Boolean,default:!0},indicatorPosition:{type:String,default:"outside"},indicatorPlacement:{type:String,default:"outside"},indicatorTextColor:String,circleGap:{type:Number,default:1},height:Number,borderRadius:[String,Number],fillBorderRadius:[String,Number],offsetDegree:Number}),he=z({name:"Progress",props:pe,setup(e){const u=v(()=>e.indicatorPlacement||e.indicatorPosition),c=v(()=>{if(e.gapDegree||e.gapDegree===0)return e.gapDegree;if(e.type==="dashboard")return 75}),{mergedClsPrefixRef:f,inlineThemeDisabled:a}=Q(e),o=E("Progress","-progress",fe,ae,e,f),t=v(()=>{const{status:g}=e,{common:{cubicBezierEaseInOut:p},self:{fontSize:h,fontSizeCircle:y,railColor:n,railHeight:m,iconSizeCircle:s,iconSizeLine:l,textColorCircle:x,textColorLineInner:C,textColorLineOuter:b,lineBgProcessing:$,fontWeightCircle:S,[j("iconColor",g)]:I,[j("fillColor",g)]:B}}=o.value;return{"--n-bezier":p,"--n-fill-color":B,"--n-font-size":h,"--n-font-size-circle":y,"--n-font-weight-circle":S,"--n-icon-color":I,"--n-icon-size-circle":s,"--n-icon-size-line":l,"--n-line-bg-processing":$,"--n-rail-color":n,"--n-rail-height":m,"--n-text-color-circle":x,"--n-text-color-line-inner":C,"--n-text-color-line-outer":b}}),i=a?Z("progress",v(()=>e.status[0]),t,e):void 0;return{mergedClsPrefix:f,mergedIndicatorPlacement:u,gapDeg:c,cssVars:a?void 0:t,themeClass:i==null?void 0:i.themeClass,onRender:i==null?void 0:i.onRender}},render(){const{type:e,cssVars:u,indicatorTextColor:c,showIndicator:f,status:a,railColor:o,railStyle:t,color:i,percentage:g,viewBoxWidth:p,strokeWidth:h,mergedIndicatorPlacement:y,unit:n,borderRadius:m,fillBorderRadius:s,height:l,processing:x,circleGap:C,mergedClsPrefix:b,gapDeg:$,gapOffsetDegree:S,themeClass:I,$slots:B,onRender:D}=this;return D==null||D(),r("div",{class:[I,`${b}-progress`,`${b}-progress--${e}`,`${b}-progress--${a}`],style:u,"aria-valuemax":100,"aria-valuemin":0,"aria-valuenow":g,role:e==="circle"||e==="line"||e==="dashboard"?"progressbar":"none"},e==="circle"||e==="dashboard"?r(ce,{clsPrefix:b,status:a,showIndicator:f,indicatorTextColor:c,railColor:o,fillColor:i,railStyle:t,offsetDegree:this.offsetDegree,percentage:g,viewBoxWidth:p,strokeWidth:h,gapDegree:$===void 0?e==="dashboard"?75:0:$,gapOffsetDegree:S,unit:n},B):e==="line"?r(ue,{clsPrefix:b,status:a,showIndicator:f,indicatorTextColor:c,railColor:o,fillColor:i,railStyle:t,percentage:g,processing:x,indicatorPlacement:y,unit:n,fillBorderRadius:s,railBorderRadius:m,height:l},B):e==="multiple-circle"?r(ge,{clsPrefix:b,strokeWidth:h,railColor:o,fillColor:i,railStyle:t,viewBoxWidth:p,percentage:g,showIndicator:f,circleGap:C},B):null)}}),ye={class:"ls-upload-field"},me={class:"ls-upload-field__controls"},be=["accept","multiple","disabled"],ve={key:1,class:"ls-upload-field__reason"},xe=z({__name:"LsUploadField",props:{modelValue:{default:""},placeholder:{default:"图片 URL 或选择文件"},buttonLabel:{default:"选择文件"},disabled:{type:Boolean},disabledReason:{default:""},loading:{type:Boolean},progress:{default:null},accept:{default:""},multiple:{type:Boolean,default:!1},showUrl:{type:Boolean,default:!0},showReason:{type:Boolean,default:!0}},emits:["update:modelValue","choose","change"],setup(e,{emit:u}){const c=u,f=re(null);function a(){var o;c("choose"),(o=f.value)==null||o.click()}return(o,t)=>(N(),L("div",ye,[O("div",me,[e.showUrl?(N(),q(R(oe),{key:0,value:e.modelValue,placeholder:e.placeholder,"onUpdate:value":t[0]||(t[0]=i=>c("update:modelValue",i))},null,8,["value","placeholder"])):W("",!0),T(R(_),{disabled:e.disabled,loading:e.loading,title:e.disabledReason||void 0,onClick:a},{icon:G(()=>[T(R(le),{size:18})]),default:G(()=>[ee(V(e.buttonLabel),1)]),_:1},8,["disabled","loading","title"]),O("input",{ref_key:"input",ref:f,class:"ls-upload-field__input",type:"file",accept:e.accept,multiple:e.multiple,disabled:e.disabled,onChange:t[1]||(t[1]=i=>c("change",i))},null,40,be)]),e.progress!==null?(N(),q(R(he),{key:0,type:"line",percentage:e.progress,"show-indicator":!0},null,8,["percentage"])):W("",!0),e.showReason&&e.disabled&&e.disabledReason?(N(),L("small",ve,V(e.disabledReason),1)):W("",!0)]))}}),Se=te(xe,[["__scopeId","data-v-e959e1a3"]]);export{Se as L};

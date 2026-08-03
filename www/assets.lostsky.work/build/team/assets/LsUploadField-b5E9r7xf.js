import{s as F,af as J,d as z,O as r,aD as A,k as v,aT as H,aU as U,aV as X,aW as Y,aX as K,aY as w,ax as P,ay as u,az as k,aF as Z,aH as E,aJ as Q,aS as j,a as L,b as O,h as q,e as R,i as W,f as T,ao as _,a6 as ee,w as G,g as re,t as V,G as te,H as ie,o as N,_ as oe}from"./index-BVG6Bwiu.js";import{N as le}from"./Input-BiPWsDEh.js";/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ae=[["path",{d:"M12 3v12",key:"1x0j5s"}],["path",{d:"m17 8-5-5-5 5",key:"7q97r8"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}]],ne=F("upload",ae);function se(e){const{infoColor:g,successColor:c,warningColor:f,errorColor:a,textColor2:i,progressRailColor:t,fontSize:o,fontWeight:n}=e;return{fontSize:o,fontSizeCircle:"28px",fontWeightCircle:n,railColor:t,railHeight:"8px",iconSizeCircle:"36px",iconSizeLine:"18px",iconColor:g,iconColorInfo:g,iconColorSuccess:c,iconColorWarning:f,iconColorError:a,textColorCircle:i,textColorLineInner:"rgb(255, 255, 255)",textColorLineOuter:i,fillColor:g,fillColorInfo:g,fillColorSuccess:c,fillColorWarning:f,fillColorError:a,lineBgProcessing:"linear-gradient(90deg, rgba(255, 255, 255, .3) 0%, rgba(255, 255, 255, .5) 100%)"}}const ce={common:J,self:se},de={success:r(Y,null),error:r(X,null),warning:r(U,null),info:r(H,null)},ue=z({name:"ProgressCircle",props:{clsPrefix:{type:String,required:!0},status:{type:String,required:!0},strokeWidth:{type:Number,required:!0},fillColor:[String,Object],railColor:String,railStyle:[String,Object],percentage:{type:Number,default:0},offsetDegree:{type:Number,default:0},showIndicator:{type:Boolean,required:!0},indicatorTextColor:String,unit:String,viewBoxWidth:{type:Number,required:!0},gapDegree:{type:Number,required:!0},gapOffsetDegree:{type:Number,default:0}},setup(e,{slots:g}){const c=v(()=>{const i="gradient",{fillColor:t}=e;return typeof t=="object"?`${i}-${K(JSON.stringify(t))}`:i});function f(i,t,o,n){const{gapDegree:p,viewBoxWidth:h,strokeWidth:b}=e,s=50,y=0,d=s,l=0,x=2*s,C=50+b/2,m=`M ${C},${C} m ${y},${d}
      a ${s},${s} 0 1 1 ${l},${-x}
      a ${s},${s} 0 1 1 ${-l},${x}`,$=Math.PI*2*s,S={stroke:n==="rail"?o:typeof e.fillColor=="object"?`url(#${c.value})`:o,strokeDasharray:`${Math.min(i,100)/100*($-p)}px ${h*8}px`,strokeDashoffset:`-${p/2}px`,transformOrigin:t?"center":void 0,transform:t?`rotate(${t}deg)`:void 0};return{pathString:m,pathStyle:S}}const a=()=>{const i=typeof e.fillColor=="object",t=i?e.fillColor.stops[0]:"",o=i?e.fillColor.stops[1]:"";return i&&r("defs",null,r("linearGradient",{id:c.value,x1:"0%",y1:"100%",x2:"100%",y2:"0%"},r("stop",{offset:"0%","stop-color":t}),r("stop",{offset:"100%","stop-color":o})))};return()=>{const{fillColor:i,railColor:t,strokeWidth:o,offsetDegree:n,status:p,percentage:h,showIndicator:b,indicatorTextColor:s,unit:y,gapOffsetDegree:d,clsPrefix:l}=e,{pathString:x,pathStyle:C}=f(100,0,t,"rail"),{pathString:m,pathStyle:$}=f(h,n,i,"fill"),S=100+o;return r("div",{class:`${l}-progress-content`,role:"none"},r("div",{class:`${l}-progress-graph`,"aria-hidden":!0},r("div",{class:`${l}-progress-graph-circle`,style:{transform:d?`rotate(${d}deg)`:void 0}},r("svg",{viewBox:`0 0 ${S} ${S}`},a(),r("g",null,r("path",{class:`${l}-progress-graph-circle-rail`,d:x,"stroke-width":o,"stroke-linecap":"round",fill:"none",style:C})),r("g",null,r("path",{class:[`${l}-progress-graph-circle-fill`,h===0&&`${l}-progress-graph-circle-fill--empty`],d:m,"stroke-width":o,"stroke-linecap":"round",fill:"none",style:$}))))),b?r("div",null,g.default?r("div",{class:`${l}-progress-custom-content`,role:"none"},g.default()):p!=="default"?r("div",{class:`${l}-progress-icon`,"aria-hidden":!0},r(A,{clsPrefix:l},{default:()=>de[p]})):r("div",{class:`${l}-progress-text`,style:{color:s},role:"none"},r("span",{class:`${l}-progress-text__percentage`},h),r("span",{class:`${l}-progress-text__unit`},y))):null)}}}),ge={success:r(Y,null),error:r(X,null),warning:r(U,null),info:r(H,null)},fe=z({name:"ProgressLine",props:{clsPrefix:{type:String,required:!0},percentage:{type:Number,default:0},railColor:String,railStyle:[String,Object],fillColor:[String,Object],status:{type:String,required:!0},indicatorPlacement:{type:String,required:!0},indicatorTextColor:String,unit:{type:String,default:"%"},processing:{type:Boolean,required:!0},showIndicator:{type:Boolean,required:!0},height:[String,Number],railBorderRadius:[String,Number],fillBorderRadius:[String,Number]},setup(e,{slots:g}){const c=v(()=>w(e.height)),f=v(()=>{var t,o;return typeof e.fillColor=="object"?`linear-gradient(to right, ${(t=e.fillColor)===null||t===void 0?void 0:t.stops[0]} , ${(o=e.fillColor)===null||o===void 0?void 0:o.stops[1]})`:e.fillColor}),a=v(()=>e.railBorderRadius!==void 0?w(e.railBorderRadius):e.height!==void 0?w(e.height,{c:.5}):""),i=v(()=>e.fillBorderRadius!==void 0?w(e.fillBorderRadius):e.railBorderRadius!==void 0?w(e.railBorderRadius):e.height!==void 0?w(e.height,{c:.5}):"");return()=>{const{indicatorPlacement:t,railColor:o,railStyle:n,percentage:p,unit:h,indicatorTextColor:b,status:s,showIndicator:y,processing:d,clsPrefix:l}=e;return r("div",{class:`${l}-progress-content`,role:"none"},r("div",{class:`${l}-progress-graph`,"aria-hidden":!0},r("div",{class:[`${l}-progress-graph-line`,{[`${l}-progress-graph-line--indicator-${t}`]:!0}]},r("div",{class:`${l}-progress-graph-line-rail`,style:[{backgroundColor:o,height:c.value,borderRadius:a.value},n]},r("div",{class:[`${l}-progress-graph-line-fill`,d&&`${l}-progress-graph-line-fill--processing`],style:{maxWidth:`${e.percentage}%`,background:f.value,height:c.value,lineHeight:c.value,borderRadius:i.value}},t==="inside"?r("div",{class:`${l}-progress-graph-line-indicator`,style:{color:b}},g.default?g.default():`${p}${h}`):null)))),y&&t==="outside"?r("div",null,g.default?r("div",{class:`${l}-progress-custom-content`,style:{color:b},role:"none"},g.default()):s==="default"?r("div",{role:"none",class:`${l}-progress-icon ${l}-progress-icon--as-text`,style:{color:b}},p,h):r("div",{class:`${l}-progress-icon`,"aria-hidden":!0},r(A,{clsPrefix:l},{default:()=>ge[s]}))):null)}}});function M(e,g,c=100){return`m ${c/2} ${c/2-e} a ${e} ${e} 0 1 1 0 ${2*e} a ${e} ${e} 0 1 1 0 -${2*e}`}const pe=z({name:"ProgressMultipleCircle",props:{clsPrefix:{type:String,required:!0},viewBoxWidth:{type:Number,required:!0},percentage:{type:Array,default:[0]},strokeWidth:{type:Number,required:!0},circleGap:{type:Number,required:!0},showIndicator:{type:Boolean,required:!0},fillColor:{type:Array,default:()=>[]},railColor:{type:Array,default:()=>[]},railStyle:{type:Array,default:()=>[]}},setup(e,{slots:g}){const c=v(()=>e.percentage.map((i,t)=>`${Math.PI*i/100*(e.viewBoxWidth/2-e.strokeWidth/2*(1+2*t)-e.circleGap*t)*2}, ${e.viewBoxWidth*8}`)),f=(a,i)=>{const t=e.fillColor[i],o=typeof t=="object"?t.stops[0]:"",n=typeof t=="object"?t.stops[1]:"";return typeof e.fillColor[i]=="object"&&r("linearGradient",{id:`gradient-${i}`,x1:"100%",y1:"0%",x2:"0%",y2:"100%"},r("stop",{offset:"0%","stop-color":o}),r("stop",{offset:"100%","stop-color":n}))};return()=>{const{viewBoxWidth:a,strokeWidth:i,circleGap:t,showIndicator:o,fillColor:n,railColor:p,railStyle:h,percentage:b,clsPrefix:s}=e;return r("div",{class:`${s}-progress-content`,role:"none"},r("div",{class:`${s}-progress-graph`,"aria-hidden":!0},r("div",{class:`${s}-progress-graph-circle`},r("svg",{viewBox:`0 0 ${a} ${a}`},r("defs",null,b.map((y,d)=>f(y,d))),b.map((y,d)=>r("g",{key:d},r("path",{class:`${s}-progress-graph-circle-rail`,d:M(a/2-i/2*(1+2*d)-t*d,i,a),"stroke-width":i,"stroke-linecap":"round",fill:"none",style:[{strokeDashoffset:0,stroke:p[d]},h[d]]}),r("path",{class:[`${s}-progress-graph-circle-fill`,y===0&&`${s}-progress-graph-circle-fill--empty`],d:M(a/2-i/2*(1+2*d)-t*d,i,a),"stroke-width":i,"stroke-linecap":"round",fill:"none",style:{strokeDasharray:c.value[d],strokeDashoffset:0,stroke:typeof n[d]=="object"?`url(#gradient-${d})`:n[d]}})))))),o&&g.default?r("div",null,r("div",{class:`${s}-progress-text`},g.default())):null)}}}),he=P([u("progress",{display:"inline-block"},[u("progress-icon",`
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
 `)]),u("progress-content",{position:"relative"}),u("progress-graph",{position:"relative"},[u("progress-graph-circle",[P("svg",{verticalAlign:"bottom"}),u("progress-graph-circle-fill",`
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
 `)]),be=Object.assign(Object.assign({},E.props),{processing:Boolean,type:{type:String,default:"line"},gapDegree:Number,gapOffsetDegree:Number,status:{type:String,default:"default"},railColor:[String,Array],railStyle:[String,Array],color:[String,Array,Object],viewBoxWidth:{type:Number,default:100},strokeWidth:{type:Number,default:7},percentage:[Number,Array],unit:{type:String,default:"%"},showIndicator:{type:Boolean,default:!0},indicatorPosition:{type:String,default:"outside"},indicatorPlacement:{type:String,default:"outside"},indicatorTextColor:String,circleGap:{type:Number,default:1},height:Number,borderRadius:[String,Number],fillBorderRadius:[String,Number],offsetDegree:Number}),ye=z({name:"Progress",props:be,setup(e){const g=v(()=>e.indicatorPlacement||e.indicatorPosition),c=v(()=>{if(e.gapDegree||e.gapDegree===0)return e.gapDegree;if(e.type==="dashboard")return 75}),{mergedClsPrefixRef:f,inlineThemeDisabled:a}=Z(e),i=E("Progress","-progress",he,ce,e,f),t=v(()=>{const{status:n}=e,{common:{cubicBezierEaseInOut:p},self:{fontSize:h,fontSizeCircle:b,railColor:s,railHeight:y,iconSizeCircle:d,iconSizeLine:l,textColorCircle:x,textColorLineInner:C,textColorLineOuter:m,lineBgProcessing:$,fontWeightCircle:S,[j("iconColor",n)]:I,[j("fillColor",n)]:B}}=i.value;return{"--n-bezier":p,"--n-fill-color":B,"--n-font-size":h,"--n-font-size-circle":b,"--n-font-weight-circle":S,"--n-icon-color":I,"--n-icon-size-circle":d,"--n-icon-size-line":l,"--n-line-bg-processing":$,"--n-rail-color":s,"--n-rail-height":y,"--n-text-color-circle":x,"--n-text-color-line-inner":C,"--n-text-color-line-outer":m}}),o=a?Q("progress",v(()=>e.status[0]),t,e):void 0;return{mergedClsPrefix:f,mergedIndicatorPlacement:g,gapDeg:c,cssVars:a?void 0:t,themeClass:o==null?void 0:o.themeClass,onRender:o==null?void 0:o.onRender}},render(){const{type:e,cssVars:g,indicatorTextColor:c,showIndicator:f,status:a,railColor:i,railStyle:t,color:o,percentage:n,viewBoxWidth:p,strokeWidth:h,mergedIndicatorPlacement:b,unit:s,borderRadius:y,fillBorderRadius:d,height:l,processing:x,circleGap:C,mergedClsPrefix:m,gapDeg:$,gapOffsetDegree:S,themeClass:I,$slots:B,onRender:D}=this;return D==null||D(),r("div",{class:[I,`${m}-progress`,`${m}-progress--${e}`,`${m}-progress--${a}`],style:g,"aria-valuemax":100,"aria-valuemin":0,"aria-valuenow":n,role:e==="circle"||e==="line"||e==="dashboard"?"progressbar":"none"},e==="circle"||e==="dashboard"?r(ue,{clsPrefix:m,status:a,showIndicator:f,indicatorTextColor:c,railColor:i,fillColor:o,railStyle:t,offsetDegree:this.offsetDegree,percentage:n,viewBoxWidth:p,strokeWidth:h,gapDegree:$===void 0?e==="dashboard"?75:0:$,gapOffsetDegree:S,unit:s},B):e==="line"?r(fe,{clsPrefix:m,status:a,showIndicator:f,indicatorTextColor:c,railColor:i,fillColor:o,railStyle:t,percentage:n,processing:x,indicatorPlacement:b,unit:s,fillBorderRadius:d,railBorderRadius:y,height:l},B):e==="multiple-circle"?r(pe,{clsPrefix:m,strokeWidth:h,railColor:i,fillColor:o,railStyle:t,viewBoxWidth:p,percentage:n,showIndicator:f,circleGap:C},B):null)}}),me={class:"ls-upload-field"},ve={class:"ls-upload-field__controls"},xe=["accept","multiple","disabled"],Ce={key:1,class:"ls-upload-field__reason"},$e=z({__name:"LsUploadField",props:{modelValue:{default:""},placeholder:{default:"图片 URL 或选择文件"},buttonLabel:{default:"选择文件"},disabled:{type:Boolean},disabledReason:{default:""},loading:{type:Boolean},progress:{default:null},accept:{default:""},multiple:{type:Boolean,default:!1},showUrl:{type:Boolean,default:!0},showReason:{type:Boolean,default:!1}},emits:["update:modelValue","choose","change"],setup(e,{emit:g}){const c=e,f=g,a=te(null),i=v(()=>c.disabled&&!!c.disabledReason.trim());function t(){var o;if(c.disabled){i.value&&ie.info(c.disabledReason.trim());return}f("choose"),(o=a.value)==null||o.click()}return(o,n)=>(N(),L("div",me,[O("div",ve,[e.showUrl?(N(),q(R(le),{key:0,value:e.modelValue,placeholder:e.placeholder,"onUpdate:value":n[0]||(n[0]=p=>f("update:modelValue",p))},null,8,["value","placeholder"])):W("",!0),T(R(_),{disabled:e.disabled&&!i.value,"aria-disabled":e.disabled||void 0,class:ee({"ls-upload-field__button--disabled":i.value}),loading:e.loading,title:e.disabledReason||void 0,onClick:t},{icon:G(()=>[T(R(ne),{size:18})]),default:G(()=>[re(V(e.buttonLabel),1)]),_:1},8,["disabled","aria-disabled","class","loading","title"]),O("input",{ref_key:"input",ref:a,class:"ls-upload-field__input",type:"file",accept:e.accept,multiple:e.multiple,disabled:e.disabled,onChange:n[1]||(n[1]=p=>f("change",p))},null,40,xe)]),e.progress!==null?(N(),q(R(ye),{key:0,type:"line",percentage:e.progress,"show-indicator":!0},null,8,["percentage"])):W("",!0),e.showReason&&e.disabled&&e.disabledReason?(N(),L("small",Ce,V(e.disabledReason),1)):W("",!0)]))}}),we=oe($e,[["__scopeId","data-v-813e1498"]]);export{we as L};

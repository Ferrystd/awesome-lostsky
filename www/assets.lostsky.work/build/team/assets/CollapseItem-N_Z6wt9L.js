import{h as H,u as B,c as W,d as P,j as T,k as V,N as q}from"./Loading-Bt4hDgED.js";import{c as b,t as K,d as Z,a as u,e as w,f as d,v as X,u as D,h as j,l as G,x as J,y as Q}from"./light-Ccjcu9At.js";import{f as R,X as l,H as Y,d as E,a6 as ee,E as te,a4 as L,a1 as re,a2 as ae}from"./index--6Kpy4Zw.js";import{N as oe}from"./Button-Tgecffg0.js";import{u as ne}from"./use-false-until-truthy-NCm2iyUg.js";import{c as ie}from"./index-BJKaMiZy.js";import{h as _}from"./happens-in-CM8LO42l.js";const le=R({name:"ChevronLeft",render(){return l("svg",{viewBox:"0 0 16 16",fill:"none",xmlns:"http://www.w3.org/2000/svg"},l("path",{d:"M10.3536 3.14645C10.5488 3.34171 10.5488 3.65829 10.3536 3.85355L6.20711 8L10.3536 12.1464C10.5488 12.3417 10.5488 12.6583 10.3536 12.8536C10.1583 13.0488 9.84171 13.0488 9.64645 12.8536L5.14645 8.35355C4.95118 8.15829 4.95118 7.84171 5.14645 7.64645L9.64645 3.14645C9.84171 2.95118 10.1583 2.95118 10.3536 3.14645Z",fill:"currentColor"}))}}),se=R({name:"ChevronRight",render(){return l("svg",{viewBox:"0 0 16 16",fill:"none",xmlns:"http://www.w3.org/2000/svg"},l("path",{d:"M5.64645 3.14645C5.45118 3.34171 5.45118 3.65829 5.64645 3.85355L9.79289 8L5.64645 12.1464C5.45118 12.3417 5.45118 12.6583 5.64645 12.8536C5.84171 13.0488 6.15829 13.0488 6.35355 12.8536L10.8536 8.35355C11.0488 8.15829 11.0488 7.84171 10.8536 7.64645L6.35355 3.14645C6.15829 2.95118 5.84171 2.95118 5.64645 3.14645Z",fill:"currentColor"}))}}),{cubicBezierEaseInOut:x,cubicBezierEaseOut:de,cubicBezierEaseIn:ce}=K;function pe({overflow:e="hidden",duration:t=".3s",originalTransition:n="",leavingDelay:r="0s",foldPadding:s=!1,enterToProps:a=void 0,leaveToProps:p=void 0,reverse:f=!1}={}){const m=f?"leave":"enter",c=f?"enter":"leave";return[b(`&.fade-in-height-expand-transition-${c}-from,
 &.fade-in-height-expand-transition-${m}-to`,Object.assign(Object.assign({},a),{opacity:1})),b(`&.fade-in-height-expand-transition-${c}-to,
 &.fade-in-height-expand-transition-${m}-from`,Object.assign(Object.assign({},p),{opacity:0,marginTop:"0 !important",marginBottom:"0 !important",paddingTop:s?"0 !important":void 0,paddingBottom:s?"0 !important":void 0})),b(`&.fade-in-height-expand-transition-${c}-active`,`
 overflow: ${e};
 transition:
 max-height ${t} ${x} ${r},
 opacity ${t} ${de} ${r},
 margin-top ${t} ${x} ${r},
 margin-bottom ${t} ${x} ${r},
 padding-top ${t} ${x} ${r},
 padding-bottom ${t} ${x} ${r}
 ${n?`,${n}`:""}
 `),b(`&.fade-in-height-expand-transition-${m}-active`,`
 overflow: ${e};
 transition:
 max-height ${t} ${x},
 opacity ${t} ${ce},
 margin-top ${t} ${x},
 margin-bottom ${t} ${x},
 padding-top ${t} ${x},
 padding-bottom ${t} ${x}
 ${n?`,${n}`:""}
 `)]}function me(e){const{fontWeight:t,textColor1:n,textColor2:r,textColorDisabled:s,dividerColor:a,fontSize:p}=e;return{titleFontSize:p,titleFontWeight:t,dividerColor:a,titleTextColor:n,titleTextColorDisabled:s,fontSize:p,textColor:r,arrowColor:r,arrowColorDisabled:s,itemMargin:"16px 0 0 0",titlePadding:"16px 0 0 0"}}const fe={common:Z,self:me},he=u("collapse","width: 100%;",[u("collapse-item",`
 font-size: var(--n-font-size);
 color: var(--n-text-color);
 transition:
 color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 margin: var(--n-item-margin);
 `,[w("disabled",[d("header","cursor: not-allowed;",[d("header-main",`
 color: var(--n-title-text-color-disabled);
 `),u("collapse-item-arrow",`
 color: var(--n-arrow-color-disabled);
 `)])]),u("collapse-item","margin-left: 32px;"),b("&:first-child","margin-top: 0;"),b("&:first-child >",[d("header","padding-top: 0;")]),w("left-arrow-placement",[d("header",[u("collapse-item-arrow","margin-right: 4px;")])]),w("right-arrow-placement",[d("header",[u("collapse-item-arrow","margin-left: 4px;")])]),d("content-wrapper",[d("content-inner","padding-top: 16px;"),pe({duration:"0.15s"})]),w("active",[d("header",[w("active",[u("collapse-item-arrow","transform: rotate(90deg);")])])]),b("&:not(:first-child)","border-top: 1px solid var(--n-divider-color);"),X("disabled",[w("trigger-area-main",[d("header",[d("header-main","cursor: pointer;"),u("collapse-item-arrow","cursor: default;")])]),w("trigger-area-arrow",[d("header",[u("collapse-item-arrow","cursor: pointer;")])]),w("trigger-area-extra",[d("header",[d("header-extra","cursor: pointer;")])])]),d("header",`
 font-size: var(--n-title-font-size);
 display: flex;
 flex-wrap: nowrap;
 align-items: center;
 transition: color .3s var(--n-bezier);
 position: relative;
 padding: var(--n-title-padding);
 color: var(--n-title-text-color);
 `,[d("header-main",`
 display: flex;
 flex-wrap: nowrap;
 align-items: center;
 font-weight: var(--n-title-font-weight);
 transition: color .3s var(--n-bezier);
 flex: 1;
 color: var(--n-title-text-color);
 `),d("header-extra",`
 display: flex;
 align-items: center;
 transition: color .3s var(--n-bezier);
 color: var(--n-text-color);
 `),u("collapse-item-arrow",`
 display: flex;
 transition:
 transform .15s var(--n-bezier),
 color .3s var(--n-bezier);
 font-size: 18px;
 color: var(--n-arrow-color);
 `)])])]),ge=Object.assign(Object.assign({},j.props),{defaultExpandedNames:{type:[Array,String],default:null},expandedNames:[Array,String],arrowPlacement:{type:String,default:"left"},accordion:{type:Boolean,default:!1},displayDirective:{type:String,default:"if"},triggerAreas:{type:Array,default:()=>["main","extra","arrow"]},onItemHeaderClick:[Function,Array],"onUpdate:expandedNames":[Function,Array],onUpdateExpandedNames:[Function,Array],onExpandedNamesChange:{type:[Function,Array],validator:()=>!0,default:void 0}}),k=G("n-collapse"),Ee=R({name:"Collapse",props:ge,slots:Object,setup(e,{slots:t}){const{mergedClsPrefixRef:n,inlineThemeDisabled:r,mergedRtlRef:s}=D(e),a=Y(e.defaultExpandedNames),p=E(()=>e.expandedNames),f=H(p,a),m=j("Collapse","-collapse",he,fe,e,n);function c(h){const{"onUpdate:expandedNames":i,onUpdateExpandedNames:g,onExpandedNamesChange:N}=e;g&&P(g,h),i&&P(i,h),N&&P(N,h),a.value=h}function C(h){const{onItemHeaderClick:i}=e;i&&P(i,h)}function o(h,i,g){const{accordion:N}=e,{value:z}=f;if(N)h?(c([i]),C({name:i,expanded:!0,event:g})):(c([]),C({name:i,expanded:!1,event:g}));else if(!Array.isArray(z))c([i]),C({name:i,expanded:!0,event:g});else{const $=z.slice(),S=$.findIndex(A=>i===A);~S?($.splice(S,1),c($),C({name:i,expanded:!1,event:g})):($.push(i),c($),C({name:i,expanded:!0,event:g}))}}ee(k,{props:e,mergedClsPrefixRef:n,expandedNamesRef:f,slots:t,toggleItem:o});const v=B("Collapse",s,n),I=E(()=>{const{common:{cubicBezierEaseInOut:h},self:{titleFontWeight:i,dividerColor:g,titlePadding:N,titleTextColor:z,titleTextColorDisabled:$,textColor:S,arrowColor:A,fontSize:F,titleFontSize:O,arrowColorDisabled:M,itemMargin:U}}=m.value;return{"--n-font-size":F,"--n-bezier":h,"--n-text-color":S,"--n-divider-color":g,"--n-title-padding":N,"--n-title-font-size":O,"--n-title-text-color":z,"--n-title-text-color-disabled":$,"--n-title-font-weight":i,"--n-arrow-color":A,"--n-arrow-color-disabled":M,"--n-item-margin":U}}),y=r?W("collapse",void 0,I,e):void 0;return{rtlEnabled:v,mergedTheme:m,mergedClsPrefix:n,cssVars:r?void 0:I,themeClass:y==null?void 0:y.themeClass,onRender:y==null?void 0:y.onRender}},render(){var e;return(e=this.onRender)===null||e===void 0||e.call(this),l("div",{class:[`${this.mergedClsPrefix}-collapse`,this.rtlEnabled&&`${this.mergedClsPrefix}-collapse--rtl`,this.themeClass],style:this.cssVars},this.$slots)}}),ue=R({name:"CollapseItemContent",props:{displayDirective:{type:String,required:!0},show:Boolean,clsPrefix:{type:String,required:!0}},setup(e){return{onceTrue:ne(L(e,"show"))}},render(){return l(oe,null,{default:()=>{const{show:e,displayDirective:t,onceTrue:n,clsPrefix:r}=this,s=t==="show"&&n,a=l("div",{class:`${r}-collapse-item__content-wrapper`},l("div",{class:`${r}-collapse-item__content-inner`},this.$slots));return s?te(a,[[re,e]]):e?a:null}})}}),xe={title:String,name:[String,Number],disabled:Boolean,displayDirective:String},Re=R({name:"CollapseItem",props:xe,setup(e){const{mergedRtlRef:t}=D(e),n=ie(),r=J(()=>{var o;return(o=e.name)!==null&&o!==void 0?o:n}),s=ae(k);s||Q("collapse-item","`n-collapse-item` must be placed inside `n-collapse`.");const{expandedNamesRef:a,props:p,mergedClsPrefixRef:f,slots:m}=s,c=E(()=>{const{value:o}=a;if(Array.isArray(o)){const{value:v}=r;return!~o.findIndex(I=>I===v)}else if(o){const{value:v}=r;return v!==o}return!0});return{rtlEnabled:B("Collapse",t,f),collapseSlots:m,randomName:n,mergedClsPrefix:f,collapsed:c,triggerAreas:L(p,"triggerAreas"),mergedDisplayDirective:E(()=>{const{displayDirective:o}=e;return o||p.displayDirective}),arrowPlacement:E(()=>p.arrowPlacement),handleClick(o){let v="main";_(o,"arrow")&&(v="arrow"),_(o,"extra")&&(v="extra"),p.triggerAreas.includes(v)&&s&&!e.disabled&&s.toggleItem(c.value,r.value,o)}}},render(){const{collapseSlots:e,$slots:t,arrowPlacement:n,collapsed:r,mergedDisplayDirective:s,mergedClsPrefix:a,disabled:p,triggerAreas:f}=this,m=T(t.header,{collapsed:r},()=>[this.title]),c=t["header-extra"]||e["header-extra"],C=t.arrow||e.arrow;return l("div",{class:[`${a}-collapse-item`,`${a}-collapse-item--${n}-arrow-placement`,p&&`${a}-collapse-item--disabled`,!r&&`${a}-collapse-item--active`,f.map(o=>`${a}-collapse-item--trigger-area-${o}`)]},l("div",{class:[`${a}-collapse-item__header`,!r&&`${a}-collapse-item__header--active`]},l("div",{class:`${a}-collapse-item__header-main`,onClick:this.handleClick},n==="right"&&m,l("div",{class:`${a}-collapse-item-arrow`,key:this.rtlEnabled?0:1,"data-arrow":!0},T(C,{collapsed:r},()=>[l(q,{clsPrefix:a},{default:()=>this.rtlEnabled?l(le,null):l(se,null)})])),n==="left"&&m),V(c,{collapsed:r},o=>l("div",{class:`${a}-collapse-item__header-extra`,onClick:this.handleClick,"data-extra":!0},o))),l(ue,{clsPrefix:a,displayDirective:s,show:!r},t))}});export{Re as N,Ee as a};

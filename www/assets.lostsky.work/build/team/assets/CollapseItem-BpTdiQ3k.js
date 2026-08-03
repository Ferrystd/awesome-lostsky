import{d as S,O as i,af as H,ay as u,az as x,aB as l,ax as D,bb as O,aC as W,aF as T,G as V,aI as q,aH as _,bc as F,aJ as K,k as N,ah as G,aP as J,aM as P,bd as Z,as as Q,be as X,aL as k,b8 as Y,an as $,bf as ee,bg as ae,bh as re,ai as te,aw as oe,aO as A,aD as le,bi as se}from"./index-BVG6Bwiu.js";const ie=S({name:"ChevronLeft",render(){return i("svg",{viewBox:"0 0 16 16",fill:"none",xmlns:"http://www.w3.org/2000/svg"},i("path",{d:"M10.3536 3.14645C10.5488 3.34171 10.5488 3.65829 10.3536 3.85355L6.20711 8L10.3536 12.1464C10.5488 12.3417 10.5488 12.6583 10.3536 12.8536C10.1583 13.0488 9.84171 13.0488 9.64645 12.8536L5.14645 8.35355C4.95118 8.15829 4.95118 7.84171 5.14645 7.64645L9.64645 3.14645C9.84171 2.95118 10.1583 2.95118 10.3536 3.14645Z",fill:"currentColor"}))}});function ne(e){const{fontWeight:n,textColor1:s,textColor2:t,textColorDisabled:d,dividerColor:a,fontSize:c}=e;return{titleFontSize:c,titleFontWeight:n,dividerColor:a,titleTextColor:s,titleTextColorDisabled:d,fontSize:c,textColor:t,arrowColor:t,arrowColorDisabled:d,itemMargin:"16px 0 0 0",titlePadding:"16px 0 0 0"}}const de={common:H,self:ne},ce=u("collapse","width: 100%;",[u("collapse-item",`
 font-size: var(--n-font-size);
 color: var(--n-text-color);
 transition:
 color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 margin: var(--n-item-margin);
 `,[x("disabled",[l("header","cursor: not-allowed;",[l("header-main",`
 color: var(--n-title-text-color-disabled);
 `),u("collapse-item-arrow",`
 color: var(--n-arrow-color-disabled);
 `)])]),u("collapse-item","margin-left: 32px;"),D("&:first-child","margin-top: 0;"),D("&:first-child >",[l("header","padding-top: 0;")]),x("left-arrow-placement",[l("header",[u("collapse-item-arrow","margin-right: 4px;")])]),x("right-arrow-placement",[l("header",[u("collapse-item-arrow","margin-left: 4px;")])]),l("content-wrapper",[l("content-inner","padding-top: 16px;"),O({duration:"0.15s"})]),x("active",[l("header",[x("active",[u("collapse-item-arrow","transform: rotate(90deg);")])])]),D("&:not(:first-child)","border-top: 1px solid var(--n-divider-color);"),W("disabled",[x("trigger-area-main",[l("header",[l("header-main","cursor: pointer;"),u("collapse-item-arrow","cursor: default;")])]),x("trigger-area-arrow",[l("header",[u("collapse-item-arrow","cursor: pointer;")])]),x("trigger-area-extra",[l("header",[l("header-extra","cursor: pointer;")])])]),l("header",`
 font-size: var(--n-title-font-size);
 display: flex;
 flex-wrap: nowrap;
 align-items: center;
 transition: color .3s var(--n-bezier);
 position: relative;
 padding: var(--n-title-padding);
 color: var(--n-title-text-color);
 `,[l("header-main",`
 display: flex;
 flex-wrap: nowrap;
 align-items: center;
 font-weight: var(--n-title-font-weight);
 transition: color .3s var(--n-bezier);
 flex: 1;
 color: var(--n-title-text-color);
 `),l("header-extra",`
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
 `)])])]),pe=Object.assign(Object.assign({},_.props),{defaultExpandedNames:{type:[Array,String],default:null},expandedNames:[Array,String],arrowPlacement:{type:String,default:"left"},accordion:{type:Boolean,default:!1},displayDirective:{type:String,default:"if"},triggerAreas:{type:Array,default:()=>["main","extra","arrow"]},onItemHeaderClick:[Function,Array],"onUpdate:expandedNames":[Function,Array],onUpdateExpandedNames:[Function,Array],onExpandedNamesChange:{type:[Function,Array],validator:()=>!0,default:void 0}}),B=G("n-collapse"),he=S({name:"Collapse",props:pe,slots:Object,setup(e,{slots:n}){const{mergedClsPrefixRef:s,inlineThemeDisabled:t,mergedRtlRef:d}=T(e),a=V(e.defaultExpandedNames),c=N(()=>e.expandedNames),v=q(c,a),C=_("Collapse","-collapse",ce,de,e,s);function p(m){const{"onUpdate:expandedNames":o,onUpdateExpandedNames:f,onExpandedNamesChange:y}=e;f&&P(f,m),o&&P(o,m),y&&P(y,m),a.value=m}function g(m){const{onItemHeaderClick:o}=e;o&&P(o,m)}function r(m,o,f){const{accordion:y}=e,{value:E}=v;if(y)m?(p([o]),g({name:o,expanded:!0,event:f})):(p([]),g({name:o,expanded:!1,event:f}));else if(!Array.isArray(E))p([o]),g({name:o,expanded:!0,event:f});else{const w=E.slice(),I=w.findIndex(z=>o===z);~I?(w.splice(I,1),p(w),g({name:o,expanded:!1,event:f})):(w.push(o),p(w),g({name:o,expanded:!0,event:f}))}}J(B,{props:e,mergedClsPrefixRef:s,expandedNamesRef:v,slots:n,toggleItem:r});const h=F("Collapse",d,s),R=N(()=>{const{common:{cubicBezierEaseInOut:m},self:{titleFontWeight:o,dividerColor:f,titlePadding:y,titleTextColor:E,titleTextColorDisabled:w,textColor:I,arrowColor:z,fontSize:L,titleFontSize:M,arrowColorDisabled:U,itemMargin:j}}=C.value;return{"--n-font-size":L,"--n-bezier":m,"--n-text-color":I,"--n-divider-color":f,"--n-title-padding":y,"--n-title-font-size":M,"--n-title-text-color":E,"--n-title-text-color-disabled":w,"--n-title-font-weight":o,"--n-arrow-color":z,"--n-arrow-color-disabled":U,"--n-item-margin":j}}),b=t?K("collapse",void 0,R,e):void 0;return{rtlEnabled:h,mergedTheme:C,mergedClsPrefix:s,cssVars:t?void 0:R,themeClass:b==null?void 0:b.themeClass,onRender:b==null?void 0:b.onRender}},render(){var e;return(e=this.onRender)===null||e===void 0||e.call(this),i("div",{class:[`${this.mergedClsPrefix}-collapse`,this.rtlEnabled&&`${this.mergedClsPrefix}-collapse--rtl`,this.themeClass],style:this.cssVars},this.$slots)}}),me=S({name:"CollapseItemContent",props:{displayDirective:{type:String,required:!0},show:Boolean,clsPrefix:{type:String,required:!0}},setup(e){return{onceTrue:X(k(e,"show"))}},render(){return i(Z,null,{default:()=>{const{show:e,displayDirective:n,onceTrue:s,clsPrefix:t}=this,d=n==="show"&&s,a=i("div",{class:`${t}-collapse-item__content-wrapper`},i("div",{class:`${t}-collapse-item__content-inner`},this.$slots));return d?Q(a,[[Y,e]]):e?a:null}})}}),fe={title:String,name:[String,Number],disabled:Boolean,displayDirective:String},ge=S({name:"CollapseItem",props:fe,setup(e){const{mergedRtlRef:n}=T(e),s=ae(),t=re(()=>{var r;return(r=e.name)!==null&&r!==void 0?r:s}),d=te(B);d||oe("collapse-item","`n-collapse-item` must be placed inside `n-collapse`.");const{expandedNamesRef:a,props:c,mergedClsPrefixRef:v,slots:C}=d,p=N(()=>{const{value:r}=a;if(Array.isArray(r)){const{value:h}=t;return!~r.findIndex(R=>R===h)}else if(r){const{value:h}=t;return h!==r}return!0});return{rtlEnabled:F("Collapse",n,v),collapseSlots:C,randomName:s,mergedClsPrefix:v,collapsed:p,triggerAreas:k(c,"triggerAreas"),mergedDisplayDirective:N(()=>{const{displayDirective:r}=e;return r||c.displayDirective}),arrowPlacement:N(()=>c.arrowPlacement),handleClick(r){let h="main";A(r,"arrow")&&(h="arrow"),A(r,"extra")&&(h="extra"),c.triggerAreas.includes(h)&&d&&!e.disabled&&d.toggleItem(p.value,t.value,r)}}},render(){const{collapseSlots:e,$slots:n,arrowPlacement:s,collapsed:t,mergedDisplayDirective:d,mergedClsPrefix:a,disabled:c,triggerAreas:v}=this,C=$(n.header,{collapsed:t},()=>[this.title]),p=n["header-extra"]||e["header-extra"],g=n.arrow||e.arrow;return i("div",{class:[`${a}-collapse-item`,`${a}-collapse-item--${s}-arrow-placement`,c&&`${a}-collapse-item--disabled`,!t&&`${a}-collapse-item--active`,v.map(r=>`${a}-collapse-item--trigger-area-${r}`)]},i("div",{class:[`${a}-collapse-item__header`,!t&&`${a}-collapse-item__header--active`]},i("div",{class:`${a}-collapse-item__header-main`,onClick:this.handleClick},s==="right"&&C,i("div",{class:`${a}-collapse-item-arrow`,key:this.rtlEnabled?0:1,"data-arrow":!0},$(g,{collapsed:t},()=>[i(le,{clsPrefix:a},{default:()=>this.rtlEnabled?i(ie,null):i(se,null)})])),s==="left"&&C),ee(p,{collapsed:t},r=>i("div",{class:`${a}-collapse-item__header-extra`,onClick:this.handleClick,"data-extra":!0},r))),i(me,{clsPrefix:a,displayDirective:d,show:!t},n))}});export{he as N,ge as a};

import{d as S,Q as n,aa as H,at as u,au as g,aw as l,as as D,b6 as W,ax as O,aA as T,G as V,aD as K,aC as _,b7 as k,aE as q,ac as G,k as N,aK as J,aH as P,b8 as Q,an as Z,b9 as X,aG as F,b3 as Y,aj as $,ba as ee,bb as ae,bc as re,ad as te,ar as oe,aJ as A,ay as le,bd as se}from"./index-DgcYrrlp.js";const ne=S({name:"ChevronLeft",render(){return n("svg",{viewBox:"0 0 16 16",fill:"none",xmlns:"http://www.w3.org/2000/svg"},n("path",{d:"M10.3536 3.14645C10.5488 3.34171 10.5488 3.65829 10.3536 3.85355L6.20711 8L10.3536 12.1464C10.5488 12.3417 10.5488 12.6583 10.3536 12.8536C10.1583 13.0488 9.84171 13.0488 9.64645 12.8536L5.14645 8.35355C4.95118 8.15829 4.95118 7.84171 5.14645 7.64645L9.64645 3.14645C9.84171 2.95118 10.1583 2.95118 10.3536 3.14645Z",fill:"currentColor"}))}});function ie(e){const{fontWeight:i,textColor1:s,textColor2:t,textColorDisabled:d,dividerColor:a,fontSize:c}=e;return{titleFontSize:c,titleFontWeight:i,dividerColor:a,titleTextColor:s,titleTextColorDisabled:d,fontSize:c,textColor:t,arrowColor:t,arrowColorDisabled:d,itemMargin:"16px 0 0 0",titlePadding:"16px 0 0 0"}}const de={common:H,self:ie},ce=u("collapse","width: 100%;",[u("collapse-item",`
 font-size: var(--n-font-size);
 color: var(--n-text-color);
 transition:
 color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 margin: var(--n-item-margin);
 `,[g("disabled",[l("header","cursor: not-allowed;",[l("header-main",`
 color: var(--n-title-text-color-disabled);
 `),u("collapse-item-arrow",`
 color: var(--n-arrow-color-disabled);
 `)])]),u("collapse-item","margin-left: 32px;"),D("&:first-child","margin-top: 0;"),D("&:first-child >",[l("header","padding-top: 0;")]),g("left-arrow-placement",[l("header",[u("collapse-item-arrow","margin-right: 4px;")])]),g("right-arrow-placement",[l("header",[u("collapse-item-arrow","margin-left: 4px;")])]),l("content-wrapper",[l("content-inner","padding-top: 16px;"),W({duration:"0.15s"})]),g("active",[l("header",[g("active",[u("collapse-item-arrow","transform: rotate(90deg);")])])]),D("&:not(:first-child)","border-top: 1px solid var(--n-divider-color);"),O("disabled",[g("trigger-area-main",[l("header",[l("header-main","cursor: pointer;"),u("collapse-item-arrow","cursor: default;")])]),g("trigger-area-arrow",[l("header",[u("collapse-item-arrow","cursor: pointer;")])]),g("trigger-area-extra",[l("header",[l("header-extra","cursor: pointer;")])])]),l("header",`
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
 `)])])]),pe=Object.assign(Object.assign({},_.props),{defaultExpandedNames:{type:[Array,String],default:null},expandedNames:[Array,String],arrowPlacement:{type:String,default:"left"},accordion:{type:Boolean,default:!1},displayDirective:{type:String,default:"if"},triggerAreas:{type:Array,default:()=>["main","extra","arrow"]},onItemHeaderClick:[Function,Array],"onUpdate:expandedNames":[Function,Array],onUpdateExpandedNames:[Function,Array],onExpandedNamesChange:{type:[Function,Array],validator:()=>!0,default:void 0}}),j=G("n-collapse"),he=S({name:"Collapse",props:pe,slots:Object,setup(e,{slots:i}){const{mergedClsPrefixRef:s,inlineThemeDisabled:t,mergedRtlRef:d}=T(e),a=V(e.defaultExpandedNames),c=N(()=>e.expandedNames),v=K(c,a),C=_("Collapse","-collapse",ce,de,e,s);function p(m){const{"onUpdate:expandedNames":o,onUpdateExpandedNames:f,onExpandedNamesChange:y}=e;f&&P(f,m),o&&P(o,m),y&&P(y,m),a.value=m}function x(m){const{onItemHeaderClick:o}=e;o&&P(o,m)}function r(m,o,f){const{accordion:y}=e,{value:R}=v;if(y)m?(p([o]),x({name:o,expanded:!0,event:f})):(p([]),x({name:o,expanded:!1,event:f}));else if(!Array.isArray(R))p([o]),x({name:o,expanded:!0,event:f});else{const w=R.slice(),I=w.findIndex(z=>o===z);~I?(w.splice(I,1),p(w),x({name:o,expanded:!1,event:f})):(w.push(o),p(w),x({name:o,expanded:!0,event:f}))}}J(j,{props:e,mergedClsPrefixRef:s,expandedNamesRef:v,slots:i,toggleItem:r});const h=k("Collapse",d,s),E=N(()=>{const{common:{cubicBezierEaseInOut:m},self:{titleFontWeight:o,dividerColor:f,titlePadding:y,titleTextColor:R,titleTextColorDisabled:w,textColor:I,arrowColor:z,fontSize:B,titleFontSize:L,arrowColorDisabled:M,itemMargin:U}}=C.value;return{"--n-font-size":B,"--n-bezier":m,"--n-text-color":I,"--n-divider-color":f,"--n-title-padding":y,"--n-title-font-size":L,"--n-title-text-color":R,"--n-title-text-color-disabled":w,"--n-title-font-weight":o,"--n-arrow-color":z,"--n-arrow-color-disabled":M,"--n-item-margin":U}}),b=t?q("collapse",void 0,E,e):void 0;return{rtlEnabled:h,mergedTheme:C,mergedClsPrefix:s,cssVars:t?void 0:E,themeClass:b==null?void 0:b.themeClass,onRender:b==null?void 0:b.onRender}},render(){var e;return(e=this.onRender)===null||e===void 0||e.call(this),n("div",{class:[`${this.mergedClsPrefix}-collapse`,this.rtlEnabled&&`${this.mergedClsPrefix}-collapse--rtl`,this.themeClass],style:this.cssVars},this.$slots)}}),me=S({name:"CollapseItemContent",props:{displayDirective:{type:String,required:!0},show:Boolean,clsPrefix:{type:String,required:!0}},setup(e){return{onceTrue:X(F(e,"show"))}},render(){return n(Q,null,{default:()=>{const{show:e,displayDirective:i,onceTrue:s,clsPrefix:t}=this,d=i==="show"&&s,a=n("div",{class:`${t}-collapse-item__content-wrapper`},n("div",{class:`${t}-collapse-item__content-inner`},this.$slots));return d?Z(a,[[Y,e]]):e?a:null}})}}),fe={title:String,name:[String,Number],disabled:Boolean,displayDirective:String},xe=S({name:"CollapseItem",props:fe,setup(e){const{mergedRtlRef:i}=T(e),s=ae(),t=re(()=>{var r;return(r=e.name)!==null&&r!==void 0?r:s}),d=te(j);d||oe("collapse-item","`n-collapse-item` must be placed inside `n-collapse`.");const{expandedNamesRef:a,props:c,mergedClsPrefixRef:v,slots:C}=d,p=N(()=>{const{value:r}=a;if(Array.isArray(r)){const{value:h}=t;return!~r.findIndex(E=>E===h)}else if(r){const{value:h}=t;return h!==r}return!0});return{rtlEnabled:k("Collapse",i,v),collapseSlots:C,randomName:s,mergedClsPrefix:v,collapsed:p,triggerAreas:F(c,"triggerAreas"),mergedDisplayDirective:N(()=>{const{displayDirective:r}=e;return r||c.displayDirective}),arrowPlacement:N(()=>c.arrowPlacement),handleClick(r){let h="main";A(r,"arrow")&&(h="arrow"),A(r,"extra")&&(h="extra"),c.triggerAreas.includes(h)&&d&&!e.disabled&&d.toggleItem(p.value,t.value,r)}}},render(){const{collapseSlots:e,$slots:i,arrowPlacement:s,collapsed:t,mergedDisplayDirective:d,mergedClsPrefix:a,disabled:c,triggerAreas:v}=this,C=$(i.header,{collapsed:t},()=>[this.title]),p=i["header-extra"]||e["header-extra"],x=i.arrow||e.arrow;return n("div",{class:[`${a}-collapse-item`,`${a}-collapse-item--${s}-arrow-placement`,c&&`${a}-collapse-item--disabled`,!t&&`${a}-collapse-item--active`,v.map(r=>`${a}-collapse-item--trigger-area-${r}`)]},n("div",{class:[`${a}-collapse-item__header`,!t&&`${a}-collapse-item__header--active`]},n("div",{class:`${a}-collapse-item__header-main`,onClick:this.handleClick},s==="right"&&C,n("div",{class:`${a}-collapse-item-arrow`,key:this.rtlEnabled?0:1,"data-arrow":!0},$(x,{collapsed:t},()=>[n(le,{clsPrefix:a},{default:()=>this.rtlEnabled?n(ne,null):n(se,null)})])),s==="left"&&C),ee(p,{collapsed:t},r=>n("div",{class:`${a}-collapse-item__header-extra`,onClick:this.handleClick,"data-extra":!0},r))),n(me,{clsPrefix:a,displayDirective:d,show:!t},i))}});export{he as N,xe as a};

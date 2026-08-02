import{ac as G,bu as f,ad as v,aw as m,az as a,ax as R,b9 as K,av as Q,d as B,O as s,bB as U,c9 as q,at as J,aj as X,bb as Y,aD as Z,aF as A,ba as ee,aH as oe,aB as re,aT as ne,aS as te,aR as se,aU as le,k as E,G as ae,ca as ie,aQ as d,a as H,F as ce,j as de,h as $,w as ge,g as ue,t as he,e as k,o as S,_ as fe}from"./index-BSvkHgpE.js";import{N as ve}from"./Skeleton-BuVe-1SB.js";const be={iconMargin:"11px 8px 0 12px",iconMarginRtl:"11px 12px 0 8px",iconSize:"24px",closeIconSize:"16px",closeSize:"20px",closeMargin:"13px 14px 0 0",closeMarginRtl:"13px 0 0 14px",padding:"13px"};function Ce(e){const{lineHeight:o,borderRadius:i,fontWeightStrong:g,baseColor:l,dividerColor:b,actionColor:T,textColor1:u,textColor2:t,closeColorHover:h,closeColorPressed:C,closeIconColor:p,closeIconColorHover:x,closeIconColorPressed:n,infoColor:r,successColor:I,warningColor:z,errorColor:y,fontSize:P}=e;return Object.assign(Object.assign({},be),{fontSize:P,lineHeight:o,titleFontWeight:g,borderRadius:i,border:`1px solid ${b}`,color:T,titleTextColor:u,iconColor:t,contentTextColor:t,closeBorderRadius:i,closeColorHover:h,closeColorPressed:C,closeIconColor:p,closeIconColorHover:x,closeIconColorPressed:n,borderInfo:`1px solid ${f(l,v(r,{alpha:.25}))}`,colorInfo:f(l,v(r,{alpha:.08})),titleTextColorInfo:u,iconColorInfo:r,contentTextColorInfo:t,closeColorHoverInfo:h,closeColorPressedInfo:C,closeIconColorInfo:p,closeIconColorHoverInfo:x,closeIconColorPressedInfo:n,borderSuccess:`1px solid ${f(l,v(I,{alpha:.25}))}`,colorSuccess:f(l,v(I,{alpha:.08})),titleTextColorSuccess:u,iconColorSuccess:I,contentTextColorSuccess:t,closeColorHoverSuccess:h,closeColorPressedSuccess:C,closeIconColorSuccess:p,closeIconColorHoverSuccess:x,closeIconColorPressedSuccess:n,borderWarning:`1px solid ${f(l,v(z,{alpha:.33}))}`,colorWarning:f(l,v(z,{alpha:.08})),titleTextColorWarning:u,iconColorWarning:z,contentTextColorWarning:t,closeColorHoverWarning:h,closeColorPressedWarning:C,closeIconColorWarning:p,closeIconColorHoverWarning:x,closeIconColorPressedWarning:n,borderError:`1px solid ${f(l,v(y,{alpha:.25}))}`,colorError:f(l,v(y,{alpha:.08})),titleTextColorError:u,iconColorError:y,contentTextColorError:t,closeColorHoverError:h,closeColorPressedError:C,closeIconColorError:p,closeIconColorHoverError:x,closeIconColorPressedError:n})}const pe={common:G,self:Ce},xe=m("alert",`
 line-height: var(--n-line-height);
 border-radius: var(--n-border-radius);
 position: relative;
 transition: background-color .3s var(--n-bezier);
 background-color: var(--n-color);
 text-align: start;
 word-break: break-word;
`,[a("border",`
 border-radius: inherit;
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 transition: border-color .3s var(--n-bezier);
 border: var(--n-border);
 pointer-events: none;
 `),R("closable",[m("alert-body",[a("title",`
 padding-right: 24px;
 `)])]),a("icon",{color:"var(--n-icon-color)"}),m("alert-body",{padding:"var(--n-padding)"},[a("title",{color:"var(--n-title-text-color)"}),a("content",{color:"var(--n-content-text-color)"})]),K({originalTransition:"transform .3s var(--n-bezier)",enterToProps:{transform:"scale(1)"},leaveToProps:{transform:"scale(0.9)"}}),a("icon",`
 position: absolute;
 left: 0;
 top: 0;
 align-items: center;
 justify-content: center;
 display: flex;
 width: var(--n-icon-size);
 height: var(--n-icon-size);
 font-size: var(--n-icon-size);
 margin: var(--n-icon-margin);
 `),a("close",`
 transition:
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 position: absolute;
 right: 0;
 top: 0;
 margin: var(--n-close-margin);
 `),R("show-icon",[m("alert-body",{paddingLeft:"calc(var(--n-icon-margin-left) + var(--n-icon-size) + var(--n-icon-margin-right))"})]),R("right-adjust",[m("alert-body",{paddingRight:"calc(var(--n-close-size) + var(--n-padding) + 2px)"})]),m("alert-body",`
 border-radius: var(--n-border-radius);
 transition: border-color .3s var(--n-bezier);
 `,[a("title",`
 transition: color .3s var(--n-bezier);
 font-size: 16px;
 line-height: 19px;
 font-weight: var(--n-title-font-weight);
 `,[Q("& +",[a("content",{marginTop:"9px"})])]),a("content",{transition:"color .3s var(--n-bezier)",fontSize:"var(--n-font-size)"})]),a("icon",{transition:"color .3s var(--n-bezier)"})]),me=Object.assign(Object.assign({},A.props),{title:String,showIcon:{type:Boolean,default:!0},type:{type:String,default:"default"},bordered:{type:Boolean,default:!0},closable:Boolean,onClose:Function,onAfterLeave:Function,onAfterHide:Function}),Ie=B({name:"Alert",inheritAttrs:!1,props:me,slots:Object,setup(e){const{mergedClsPrefixRef:o,mergedBorderedRef:i,inlineThemeDisabled:g,mergedRtlRef:l}=Z(e),b=A("Alert","-alert",xe,pe,e,o),T=ee("Alert",l,o),u=E(()=>{const{common:{cubicBezierEaseInOut:n},self:r}=b.value,{fontSize:I,borderRadius:z,titleFontWeight:y,lineHeight:P,iconSize:_,iconMargin:w,iconMarginRtl:W,closeIconSize:L,closeBorderRadius:j,closeSize:M,closeMargin:F,closeMarginRtl:O,padding:N}=r,{type:c}=e,{left:V,right:D}=ie(w);return{"--n-bezier":n,"--n-color":r[d("color",c)],"--n-close-icon-size":L,"--n-close-border-radius":j,"--n-close-color-hover":r[d("closeColorHover",c)],"--n-close-color-pressed":r[d("closeColorPressed",c)],"--n-close-icon-color":r[d("closeIconColor",c)],"--n-close-icon-color-hover":r[d("closeIconColorHover",c)],"--n-close-icon-color-pressed":r[d("closeIconColorPressed",c)],"--n-icon-color":r[d("iconColor",c)],"--n-border":r[d("border",c)],"--n-title-text-color":r[d("titleTextColor",c)],"--n-content-text-color":r[d("contentTextColor",c)],"--n-line-height":P,"--n-border-radius":z,"--n-font-size":I,"--n-title-font-weight":y,"--n-icon-size":_,"--n-icon-margin":w,"--n-icon-margin-rtl":W,"--n-close-size":M,"--n-close-margin":F,"--n-close-margin-rtl":O,"--n-padding":N,"--n-icon-margin-left":V,"--n-icon-margin-right":D}}),t=g?oe("alert",E(()=>e.type[0]),u,e):void 0,h=ae(!0),C=()=>{const{onAfterLeave:n,onAfterHide:r}=e;n&&n(),r&&r()};return{rtlEnabled:T,mergedClsPrefix:o,mergedBordered:i,visible:h,handleCloseClick:()=>{var n;Promise.resolve((n=e.onClose)===null||n===void 0?void 0:n.call(e)).then(r=>{r!==!1&&(h.value=!1)})},handleAfterLeave:()=>{C()},mergedTheme:b,cssVars:g?void 0:u,themeClass:t==null?void 0:t.themeClass,onRender:t==null?void 0:t.onRender}},render(){var e;return(e=this.onRender)===null||e===void 0||e.call(this),s(Y,{onAfterLeave:this.handleAfterLeave},{default:()=>{const{mergedClsPrefix:o,$slots:i}=this,g={class:[`${o}-alert`,this.themeClass,this.closable&&`${o}-alert--closable`,this.showIcon&&`${o}-alert--show-icon`,!this.title&&this.closable&&`${o}-alert--right-adjust`,this.rtlEnabled&&`${o}-alert--rtl`],style:this.cssVars,role:"alert"};return this.visible?s("div",Object.assign({},U(this.$attrs,g)),this.closable&&s(q,{clsPrefix:o,class:`${o}-alert__close`,onClick:this.handleCloseClick}),this.bordered&&s("div",{class:`${o}-alert__border`}),this.showIcon&&s("div",{class:`${o}-alert__icon`,"aria-hidden":"true"},J(i.icon,()=>[s(re,{clsPrefix:o},{default:()=>{switch(this.type){case"success":return s(le,null);case"info":return s(se,null);case"warning":return s(te,null);case"error":return s(ne,null);default:return null}}})])),s("div",{class:[`${o}-alert-body`,this.mergedBordered&&`${o}-alert-body--bordered`]},X(i.header,l=>{const b=l||this.title;return b?s("div",{class:`${o}-alert-body__title`},b):null}),i.default&&s("div",{class:`${o}-alert-body__content`},i))):null}})}}),ze=["aria-busy","role"],ye=B({__name:"LsAsyncState",props:{state:{},title:{default:""},description:{default:""},rows:{default:3}},setup(e){return(o,i)=>(S(),H("section",{class:"ls-async-state","aria-busy":e.state==="loading"||void 0,role:e.state==="error"?"alert":"status"},[e.state==="loading"?(S(!0),H(ce,{key:0},de(e.rows,g=>(S(),$(k(ve),{key:g,text:"",repeat:1}))),128)):(S(),$(k(Ie),{key:1,type:"error",title:e.title||"暂时无法读取"},{default:ge(()=>[ue(he(e.description||"请稍后再试；页面其他功能仍可继续使用。"),1)]),_:1},8,["title"]))],8,ze))}}),Pe=fe(ye,[["__scopeId","data-v-f0c60eea"]]);export{Pe as L};

import{am as K,aQ as f,aG as v,ad as x,aH as a,ae as R,aR as G,af as J,d as A,M as s,aS as Q,aJ as U,aT as X,al as Y,aU as Z,ag as q,ah as W,aK as ee,ap as oe,aV as re,aW as ne,aX as te,aY as se,aZ as le,j as H,E as ae,aM as ie,au as d,c as $,F as ce,i as de,g as w,w as ge,f as ue,t as he,e as k,o as S,_ as fe}from"./index-C4UaCn-9.js";import{N as ve}from"./Skeleton-D38cqLQy.js";const Ce={iconMargin:"11px 8px 0 12px",iconMarginRtl:"11px 12px 0 8px",iconSize:"24px",closeIconSize:"16px",closeSize:"20px",closeMargin:"13px 14px 0 0",closeMarginRtl:"13px 0 0 14px",padding:"13px"};function be(e){const{lineHeight:o,borderRadius:i,fontWeightStrong:g,baseColor:l,dividerColor:C,actionColor:T,textColor1:u,textColor2:t,closeColorHover:h,closeColorPressed:b,closeIconColor:p,closeIconColorHover:m,closeIconColorPressed:n,infoColor:r,successColor:I,warningColor:z,errorColor:y,fontSize:P}=e;return Object.assign(Object.assign({},Ce),{fontSize:P,lineHeight:o,titleFontWeight:g,borderRadius:i,border:`1px solid ${C}`,color:T,titleTextColor:u,iconColor:t,contentTextColor:t,closeBorderRadius:i,closeColorHover:h,closeColorPressed:b,closeIconColor:p,closeIconColorHover:m,closeIconColorPressed:n,borderInfo:`1px solid ${f(l,v(r,{alpha:.25}))}`,colorInfo:f(l,v(r,{alpha:.08})),titleTextColorInfo:u,iconColorInfo:r,contentTextColorInfo:t,closeColorHoverInfo:h,closeColorPressedInfo:b,closeIconColorInfo:p,closeIconColorHoverInfo:m,closeIconColorPressedInfo:n,borderSuccess:`1px solid ${f(l,v(I,{alpha:.25}))}`,colorSuccess:f(l,v(I,{alpha:.08})),titleTextColorSuccess:u,iconColorSuccess:I,contentTextColorSuccess:t,closeColorHoverSuccess:h,closeColorPressedSuccess:b,closeIconColorSuccess:p,closeIconColorHoverSuccess:m,closeIconColorPressedSuccess:n,borderWarning:`1px solid ${f(l,v(z,{alpha:.33}))}`,colorWarning:f(l,v(z,{alpha:.08})),titleTextColorWarning:u,iconColorWarning:z,contentTextColorWarning:t,closeColorHoverWarning:h,closeColorPressedWarning:b,closeIconColorWarning:p,closeIconColorHoverWarning:m,closeIconColorPressedWarning:n,borderError:`1px solid ${f(l,v(y,{alpha:.25}))}`,colorError:f(l,v(y,{alpha:.08})),titleTextColorError:u,iconColorError:y,contentTextColorError:t,closeColorHoverError:h,closeColorPressedError:b,closeIconColorError:p,closeIconColorHoverError:m,closeIconColorPressedError:n})}const pe={common:K,self:be},me=x("alert",`
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
 `),R("closable",[x("alert-body",[a("title",`
 padding-right: 24px;
 `)])]),a("icon",{color:"var(--n-icon-color)"}),x("alert-body",{padding:"var(--n-padding)"},[a("title",{color:"var(--n-title-text-color)"}),a("content",{color:"var(--n-content-text-color)"})]),G({originalTransition:"transform .3s var(--n-bezier)",enterToProps:{transform:"scale(1)"},leaveToProps:{transform:"scale(0.9)"}}),a("icon",`
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
 `),R("show-icon",[x("alert-body",{paddingLeft:"calc(var(--n-icon-margin-left) + var(--n-icon-size) + var(--n-icon-margin-right))"})]),R("right-adjust",[x("alert-body",{paddingRight:"calc(var(--n-close-size) + var(--n-padding) + 2px)"})]),x("alert-body",`
 border-radius: var(--n-border-radius);
 transition: border-color .3s var(--n-bezier);
 `,[a("title",`
 transition: color .3s var(--n-bezier);
 font-size: 16px;
 line-height: 19px;
 font-weight: var(--n-title-font-weight);
 `,[J("& +",[a("content",{marginTop:"9px"})])]),a("content",{transition:"color .3s var(--n-bezier)",fontSize:"var(--n-font-size)"})]),a("icon",{transition:"color .3s var(--n-bezier)"})]),xe=Object.assign(Object.assign({},W.props),{title:String,showIcon:{type:Boolean,default:!0},type:{type:String,default:"default"},bordered:{type:Boolean,default:!0},closable:Boolean,onClose:Function,onAfterLeave:Function,onAfterHide:Function}),Ie=A({name:"Alert",inheritAttrs:!1,props:xe,slots:Object,setup(e){const{mergedClsPrefixRef:o,mergedBorderedRef:i,inlineThemeDisabled:g,mergedRtlRef:l}=q(e),C=W("Alert","-alert",me,pe,e,o),T=ee("Alert",l,o),u=H(()=>{const{common:{cubicBezierEaseInOut:n},self:r}=C.value,{fontSize:I,borderRadius:z,titleFontWeight:y,lineHeight:P,iconSize:_,iconMargin:E,iconMarginRtl:B,closeIconSize:L,closeBorderRadius:M,closeSize:j,closeMargin:F,closeMarginRtl:N,padding:O}=r,{type:c}=e,{left:V,right:D}=ie(E);return{"--n-bezier":n,"--n-color":r[d("color",c)],"--n-close-icon-size":L,"--n-close-border-radius":M,"--n-close-color-hover":r[d("closeColorHover",c)],"--n-close-color-pressed":r[d("closeColorPressed",c)],"--n-close-icon-color":r[d("closeIconColor",c)],"--n-close-icon-color-hover":r[d("closeIconColorHover",c)],"--n-close-icon-color-pressed":r[d("closeIconColorPressed",c)],"--n-icon-color":r[d("iconColor",c)],"--n-border":r[d("border",c)],"--n-title-text-color":r[d("titleTextColor",c)],"--n-content-text-color":r[d("contentTextColor",c)],"--n-line-height":P,"--n-border-radius":z,"--n-font-size":I,"--n-title-font-weight":y,"--n-icon-size":_,"--n-icon-margin":E,"--n-icon-margin-rtl":B,"--n-close-size":j,"--n-close-margin":F,"--n-close-margin-rtl":N,"--n-padding":O,"--n-icon-margin-left":V,"--n-icon-margin-right":D}}),t=g?oe("alert",H(()=>e.type[0]),u,e):void 0,h=ae(!0),b=()=>{const{onAfterLeave:n,onAfterHide:r}=e;n&&n(),r&&r()};return{rtlEnabled:T,mergedClsPrefix:o,mergedBordered:i,visible:h,handleCloseClick:()=>{var n;Promise.resolve((n=e.onClose)===null||n===void 0?void 0:n.call(e)).then(r=>{r!==!1&&(h.value=!1)})},handleAfterLeave:()=>{b()},mergedTheme:C,cssVars:g?void 0:u,themeClass:t==null?void 0:t.themeClass,onRender:t==null?void 0:t.onRender}},render(){var e;return(e=this.onRender)===null||e===void 0||e.call(this),s(Z,{onAfterLeave:this.handleAfterLeave},{default:()=>{const{mergedClsPrefix:o,$slots:i}=this,g={class:[`${o}-alert`,this.themeClass,this.closable&&`${o}-alert--closable`,this.showIcon&&`${o}-alert--show-icon`,!this.title&&this.closable&&`${o}-alert--right-adjust`,this.rtlEnabled&&`${o}-alert--rtl`],style:this.cssVars,role:"alert"};return this.visible?s("div",Object.assign({},Q(this.$attrs,g)),this.closable&&s(U,{clsPrefix:o,class:`${o}-alert__close`,onClick:this.handleCloseClick}),this.bordered&&s("div",{class:`${o}-alert__border`}),this.showIcon&&s("div",{class:`${o}-alert__icon`,"aria-hidden":"true"},X(i.icon,()=>[s(re,{clsPrefix:o},{default:()=>{switch(this.type){case"success":return s(le,null);case"info":return s(se,null);case"warning":return s(te,null);case"error":return s(ne,null);default:return null}}})])),s("div",{class:[`${o}-alert-body`,this.mergedBordered&&`${o}-alert-body--bordered`]},Y(i.header,l=>{const C=l||this.title;return C?s("div",{class:`${o}-alert-body__title`},C):null}),i.default&&s("div",{class:`${o}-alert-body__content`},i))):null}})}}),ze=["aria-busy","role"],ye=A({__name:"LsAsyncState",props:{state:{},title:{default:""},description:{default:""},rows:{default:3}},setup(e){return(o,i)=>(S(),$("section",{class:"ls-async-state","aria-busy":e.state==="loading"||void 0,role:e.state==="error"?"alert":"status"},[e.state==="loading"?(S(!0),$(ce,{key:0},de(e.rows,g=>(S(),w(k(ve),{key:g,text:"",repeat:1}))),128)):(S(),w(k(Ie),{key:1,type:"error",title:e.title||"暂时无法读取"},{default:ge(()=>[ue(he(e.description||"请稍后再试；页面其他功能仍可继续使用。"),1)]),_:1},8,["title"]))],8,ze))}}),Pe=fe(ye,[["__scopeId","data-v-f0c60eea"]]);export{Pe as L,Ie as N};

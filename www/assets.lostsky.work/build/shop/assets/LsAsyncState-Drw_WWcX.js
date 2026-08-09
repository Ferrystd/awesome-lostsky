import{b_ as Y,bQ as N,b$ as Z,c0 as x,bS as y,G as k,aV as f,I as H,c1 as ee,E as A,d as L,J as a,bb as M,c2 as oe,bo as re,b0 as ne,c3 as te,K as D,L as B,b2 as se,M as le,k as _,aE as ie,aH as ae,aG as ce,aF as de,aI as ue,q as ge,c4 as he,V as b,bp as fe,F as G,U as W,a as j,r as be,h as O,u as V,i as ve,e as me,t as Ce,o as $,_ as pe}from"./index-BnnODiGY.js";let F=!1;function xe(){if(Y&&window.CSS&&!F&&(F=!0,"registerProperty"in(window==null?void 0:window.CSS)))try{CSS.registerProperty({name:"--n-color-start",syntax:"<color>",inherits:!1,initialValue:"#0000"}),CSS.registerProperty({name:"--n-color-end",syntax:"<color>",inherits:!1,initialValue:"#0000"})}catch{}}function ye(e){const{lineHeight:o,borderRadius:t,fontWeightStrong:c,baseColor:n,dividerColor:l,actionColor:u,textColor1:g,textColor2:i,closeColorHover:h,closeColorPressed:m,closeIconColor:C,closeIconColorHover:p,closeIconColorPressed:s,infoColor:r,successColor:I,warningColor:S,errorColor:d,fontSize:z}=e;return Object.assign(Object.assign({},Z),{fontSize:z,lineHeight:o,titleFontWeight:c,borderRadius:t,border:`1px solid ${l}`,color:u,titleTextColor:g,iconColor:i,contentTextColor:i,closeBorderRadius:t,closeColorHover:h,closeColorPressed:m,closeIconColor:C,closeIconColorHover:p,closeIconColorPressed:s,borderInfo:`1px solid ${x(n,y(r,{alpha:.25}))}`,colorInfo:x(n,y(r,{alpha:.08})),titleTextColorInfo:g,iconColorInfo:r,contentTextColorInfo:i,closeColorHoverInfo:h,closeColorPressedInfo:m,closeIconColorInfo:C,closeIconColorHoverInfo:p,closeIconColorPressedInfo:s,borderSuccess:`1px solid ${x(n,y(I,{alpha:.25}))}`,colorSuccess:x(n,y(I,{alpha:.08})),titleTextColorSuccess:g,iconColorSuccess:I,contentTextColorSuccess:i,closeColorHoverSuccess:h,closeColorPressedSuccess:m,closeIconColorSuccess:C,closeIconColorHoverSuccess:p,closeIconColorPressedSuccess:s,borderWarning:`1px solid ${x(n,y(S,{alpha:.33}))}`,colorWarning:x(n,y(S,{alpha:.08})),titleTextColorWarning:g,iconColorWarning:S,contentTextColorWarning:i,closeColorHoverWarning:h,closeColorPressedWarning:m,closeIconColorWarning:C,closeIconColorHoverWarning:p,closeIconColorPressedWarning:s,borderError:`1px solid ${x(n,y(d,{alpha:.25}))}`,colorError:x(n,y(d,{alpha:.08})),titleTextColorError:g,iconColorError:d,contentTextColorError:i,closeColorHoverError:h,closeColorPressedError:m,closeIconColorError:C,closeIconColorHoverError:p,closeIconColorPressedError:s})}const Ie={common:N,self:ye},Se=k("alert",`
 line-height: var(--n-line-height);
 border-radius: var(--n-border-radius);
 position: relative;
 transition: background-color .3s var(--n-bezier);
 background-color: var(--n-color);
 text-align: start;
 word-break: break-word;
`,[f("border",`
 border-radius: inherit;
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 transition: border-color .3s var(--n-bezier);
 border: var(--n-border);
 pointer-events: none;
 `),H("closable",[k("alert-body",[f("title",`
 padding-right: 24px;
 `)])]),f("icon",{color:"var(--n-icon-color)"}),k("alert-body",{padding:"var(--n-padding)"},[f("title",{color:"var(--n-title-text-color)"}),f("content",{color:"var(--n-content-text-color)"})]),ee({originalTransition:"transform .3s var(--n-bezier)",enterToProps:{transform:"scale(1)"},leaveToProps:{transform:"scale(0.9)"}}),f("icon",`
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
 `),f("close",`
 transition:
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 position: absolute;
 right: 0;
 top: 0;
 margin: var(--n-close-margin);
 `),H("show-icon",[k("alert-body",{paddingLeft:"calc(var(--n-icon-margin-left) + var(--n-icon-size) + var(--n-icon-margin-right))"})]),H("right-adjust",[k("alert-body",{paddingRight:"calc(var(--n-close-size) + var(--n-padding) + 2px)"})]),k("alert-body",`
 border-radius: var(--n-border-radius);
 transition: border-color .3s var(--n-bezier);
 `,[f("title",`
 transition: color .3s var(--n-bezier);
 font-size: 16px;
 line-height: 19px;
 font-weight: var(--n-title-font-weight);
 `,[A("& +",[f("content",{marginTop:"9px"})])]),f("content",{transition:"color .3s var(--n-bezier)",fontSize:"var(--n-font-size)"})]),f("icon",{transition:"color .3s var(--n-bezier)"})]),ze=Object.assign(Object.assign({},B.props),{title:String,showIcon:{type:Boolean,default:!0},type:{type:String,default:"default"},bordered:{type:Boolean,default:!0},closable:Boolean,onClose:Function,onAfterLeave:Function,onAfterHide:Function}),ke=L({name:"Alert",inheritAttrs:!1,props:ze,slots:Object,setup(e){const{mergedClsPrefixRef:o,mergedBorderedRef:t,inlineThemeDisabled:c,mergedRtlRef:n}=D(e),l=B("Alert","-alert",Se,Ie,e,o),u=se("Alert",n,o),g=_(()=>{const{common:{cubicBezierEaseInOut:s},self:r}=l.value,{fontSize:I,borderRadius:S,titleFontWeight:d,lineHeight:z,iconSize:R,iconMargin:E,iconMarginRtl:T,closeIconSize:P,closeBorderRadius:w,closeSize:K,closeMargin:q,closeMarginRtl:J,padding:Q}=r,{type:v}=e,{left:U,right:X}=he(E);return{"--n-bezier":s,"--n-color":r[b("color",v)],"--n-close-icon-size":P,"--n-close-border-radius":w,"--n-close-color-hover":r[b("closeColorHover",v)],"--n-close-color-pressed":r[b("closeColorPressed",v)],"--n-close-icon-color":r[b("closeIconColor",v)],"--n-close-icon-color-hover":r[b("closeIconColorHover",v)],"--n-close-icon-color-pressed":r[b("closeIconColorPressed",v)],"--n-icon-color":r[b("iconColor",v)],"--n-border":r[b("border",v)],"--n-title-text-color":r[b("titleTextColor",v)],"--n-content-text-color":r[b("contentTextColor",v)],"--n-line-height":z,"--n-border-radius":S,"--n-font-size":I,"--n-title-font-weight":d,"--n-icon-size":R,"--n-icon-margin":E,"--n-icon-margin-rtl":T,"--n-close-size":K,"--n-close-margin":q,"--n-close-margin-rtl":J,"--n-padding":Q,"--n-icon-margin-left":U,"--n-icon-margin-right":X}}),i=c?le("alert",_(()=>e.type[0]),g,e):void 0,h=ge(!0),m=()=>{const{onAfterLeave:s,onAfterHide:r}=e;s&&s(),r&&r()};return{rtlEnabled:u,mergedClsPrefix:o,mergedBordered:t,visible:h,handleCloseClick:()=>{var s;Promise.resolve((s=e.onClose)===null||s===void 0?void 0:s.call(e)).then(r=>{r!==!1&&(h.value=!1)})},handleAfterLeave:()=>{m()},mergedTheme:l,cssVars:c?void 0:g,themeClass:i==null?void 0:i.themeClass,onRender:i==null?void 0:i.onRender}},render(){var e;return(e=this.onRender)===null||e===void 0||e.call(this),a(te,{onAfterLeave:this.handleAfterLeave},{default:()=>{const{mergedClsPrefix:o,$slots:t}=this,c={class:[`${o}-alert`,this.themeClass,this.closable&&`${o}-alert--closable`,this.showIcon&&`${o}-alert--show-icon`,!this.title&&this.closable&&`${o}-alert--right-adjust`,this.rtlEnabled&&`${o}-alert--rtl`],style:this.cssVars,role:"alert"};return this.visible?a("div",Object.assign({},M(this.$attrs,c)),this.closable&&a(oe,{clsPrefix:o,class:`${o}-alert__close`,onClick:this.handleCloseClick}),this.bordered&&a("div",{class:`${o}-alert__border`}),this.showIcon&&a("div",{class:`${o}-alert__icon`,"aria-hidden":"true"},re(t.icon,()=>[a(ie,{clsPrefix:o},{default:()=>{switch(this.type){case"success":return a(ue,null);case"info":return a(de,null);case"warning":return a(ce,null);case"error":return a(ae,null);default:return null}}})])),a("div",{class:[`${o}-alert-body`,this.mergedBordered&&`${o}-alert-body--bordered`]},ne(t.header,n=>{const l=n||this.title;return l?a("div",{class:`${o}-alert-body__title`},l):null}),t.default&&a("div",{class:`${o}-alert-body__content`},t))):null}})}});function Pe(e){const{heightSmall:o,heightMedium:t,heightLarge:c,borderRadius:n}=e;return{color:"#eee",colorEnd:"#ddd",borderRadius:n,heightSmall:o,heightMedium:t,heightLarge:c}}const we={common:N,self:Pe},Re=A([k("skeleton",`
 height: 1em;
 width: 100%;
 transition:
 --n-color-start .3s var(--n-bezier),
 --n-color-end .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 animation: 2s skeleton-loading infinite cubic-bezier(0.36, 0, 0.64, 1);
 background-color: var(--n-color-start);
 `),A("@keyframes skeleton-loading",`
 0% {
 background: var(--n-color-start);
 }
 40% {
 background: var(--n-color-end);
 }
 80% {
 background: var(--n-color-start);
 }
 100% {
 background: var(--n-color-start);
 }
 `)]),Ee=Object.assign(Object.assign({},B.props),{text:Boolean,round:Boolean,circle:Boolean,height:[String,Number],width:[String,Number],size:String,repeat:{type:Number,default:1},animated:{type:Boolean,default:!0},sharp:{type:Boolean,default:!0}}),Te=L({name:"Skeleton",inheritAttrs:!1,props:Ee,setup(e){xe();const{mergedClsPrefixRef:o,mergedComponentPropsRef:t}=D(e),c=_(()=>{var l,u;return e.size||((u=(l=t==null?void 0:t.value)===null||l===void 0?void 0:l.Skeleton)===null||u===void 0?void 0:u.size)}),n=B("Skeleton","-skeleton",Re,we,e,o);return{mergedClsPrefix:o,style:_(()=>{var l,u;const g=n.value,{common:{cubicBezierEaseInOut:i}}=g,h=g.self,{color:m,colorEnd:C,borderRadius:p}=h;let s;const{circle:r,sharp:I,round:S,width:d,height:z,text:R,animated:E}=e,T=c.value;T!==void 0&&(s=h[b("height",T)]);const P=r?(l=d??z)!==null&&l!==void 0?l:s:d,w=(u=r?d??z:z)!==null&&u!==void 0?u:s;return{display:R?"inline-block":"",verticalAlign:R?"-0.125em":"",borderRadius:r?"50%":S?"4096px":I?"":p,width:typeof P=="number"?W(P):P,height:typeof w=="number"?W(w):w,animation:E?"":"none","--n-bezier":i,"--n-color-start":m,"--n-color-end":C}})}},render(){const{repeat:e,style:o,mergedClsPrefix:t,$attrs:c}=this,n=a("div",M({class:`${t}-skeleton`,style:o},c));return e>1?a(G,null,fe(e,null).map(l=>[n,`
`])):n}}),$e=["aria-busy","role"],_e=L({__name:"LsAsyncState",props:{state:{},title:{default:""},description:{default:""},rows:{default:3}},setup(e){return(o,t)=>($(),j("section",{class:"ls-async-state","aria-busy":e.state==="loading"||void 0,role:e.state==="error"?"alert":"status"},[e.state==="loading"?($(!0),j(G,{key:0},be(e.rows,c=>($(),O(V(Te),{key:c,text:"",repeat:1}))),128)):($(),O(V(ke),{key:1,type:"error",title:e.title||"暂时无法读取"},{default:ve(()=>[me(Ce(e.description||"请稍后再试；页面其他功能仍可继续使用。"),1)]),_:1},8,["title"]))],8,$e))}}),He=pe(_e,[["__scopeId","data-v-f0c60eea"]]);export{He as L};

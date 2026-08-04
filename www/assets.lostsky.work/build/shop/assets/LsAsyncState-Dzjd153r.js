import{bN as Y,bD as M,bO as Z,bP as x,bF as y,G as k,aJ as f,I as H,bQ as ee,E as A,d as L,J as a,bR as oe,K as V,L as _,aR as re,M as ne,a$ as D,bS as te,ba as se,af as le,ai as ie,ah as ae,ag as ce,aj as de,aQ as ue,i as B,p as ge,bT as he,U as b,bb as fe,F as J,S as W,a as j,r as be,h as O,u as N,j as ve,o as E,e as me,t as Ce,_ as pe}from"./index-DvglvHvp.js";let F=!1;function xe(){if(Y&&window.CSS&&!F&&(F=!0,"registerProperty"in(window==null?void 0:window.CSS)))try{CSS.registerProperty({name:"--n-color-start",syntax:"<color>",inherits:!1,initialValue:"#0000"}),CSS.registerProperty({name:"--n-color-end",syntax:"<color>",inherits:!1,initialValue:"#0000"})}catch{}}function ye(e){const{lineHeight:o,borderRadius:t,fontWeightStrong:c,baseColor:n,dividerColor:l,actionColor:u,textColor1:g,textColor2:i,closeColorHover:h,closeColorPressed:m,closeIconColor:C,closeIconColorHover:p,closeIconColorPressed:s,infoColor:r,successColor:S,warningColor:I,errorColor:d,fontSize:z}=e;return Object.assign(Object.assign({},Z),{fontSize:z,lineHeight:o,titleFontWeight:c,borderRadius:t,border:`1px solid ${l}`,color:u,titleTextColor:g,iconColor:i,contentTextColor:i,closeBorderRadius:t,closeColorHover:h,closeColorPressed:m,closeIconColor:C,closeIconColorHover:p,closeIconColorPressed:s,borderInfo:`1px solid ${x(n,y(r,{alpha:.25}))}`,colorInfo:x(n,y(r,{alpha:.08})),titleTextColorInfo:g,iconColorInfo:r,contentTextColorInfo:i,closeColorHoverInfo:h,closeColorPressedInfo:m,closeIconColorInfo:C,closeIconColorHoverInfo:p,closeIconColorPressedInfo:s,borderSuccess:`1px solid ${x(n,y(S,{alpha:.25}))}`,colorSuccess:x(n,y(S,{alpha:.08})),titleTextColorSuccess:g,iconColorSuccess:S,contentTextColorSuccess:i,closeColorHoverSuccess:h,closeColorPressedSuccess:m,closeIconColorSuccess:C,closeIconColorHoverSuccess:p,closeIconColorPressedSuccess:s,borderWarning:`1px solid ${x(n,y(I,{alpha:.33}))}`,colorWarning:x(n,y(I,{alpha:.08})),titleTextColorWarning:g,iconColorWarning:I,contentTextColorWarning:i,closeColorHoverWarning:h,closeColorPressedWarning:m,closeIconColorWarning:C,closeIconColorHoverWarning:p,closeIconColorPressedWarning:s,borderError:`1px solid ${x(n,y(d,{alpha:.25}))}`,colorError:x(n,y(d,{alpha:.08})),titleTextColorError:g,iconColorError:d,contentTextColorError:i,closeColorHoverError:h,closeColorPressedError:m,closeIconColorError:C,closeIconColorHoverError:p,closeIconColorPressedError:s})}const Se={common:M,self:ye},Ie=k("alert",`
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
 `,[A("& +",[f("content",{marginTop:"9px"})])]),f("content",{transition:"color .3s var(--n-bezier)",fontSize:"var(--n-font-size)"})]),f("icon",{transition:"color .3s var(--n-bezier)"})]),ze=Object.assign(Object.assign({},_.props),{title:String,showIcon:{type:Boolean,default:!0},type:{type:String,default:"default"},bordered:{type:Boolean,default:!0},closable:Boolean,onClose:Function,onAfterLeave:Function,onAfterHide:Function}),ke=L({name:"Alert",inheritAttrs:!1,props:ze,slots:Object,setup(e){const{mergedClsPrefixRef:o,mergedBorderedRef:t,inlineThemeDisabled:c,mergedRtlRef:n}=V(e),l=_("Alert","-alert",Ie,Se,e,o),u=re("Alert",n,o),g=B(()=>{const{common:{cubicBezierEaseInOut:s},self:r}=l.value,{fontSize:S,borderRadius:I,titleFontWeight:d,lineHeight:z,iconSize:R,iconMargin:T,iconMarginRtl:$,closeIconSize:P,closeBorderRadius:w,closeSize:K,closeMargin:Q,closeMarginRtl:G,padding:U}=r,{type:v}=e,{left:q,right:X}=he(T);return{"--n-bezier":s,"--n-color":r[b("color",v)],"--n-close-icon-size":P,"--n-close-border-radius":w,"--n-close-color-hover":r[b("closeColorHover",v)],"--n-close-color-pressed":r[b("closeColorPressed",v)],"--n-close-icon-color":r[b("closeIconColor",v)],"--n-close-icon-color-hover":r[b("closeIconColorHover",v)],"--n-close-icon-color-pressed":r[b("closeIconColorPressed",v)],"--n-icon-color":r[b("iconColor",v)],"--n-border":r[b("border",v)],"--n-title-text-color":r[b("titleTextColor",v)],"--n-content-text-color":r[b("contentTextColor",v)],"--n-line-height":z,"--n-border-radius":I,"--n-font-size":S,"--n-title-font-weight":d,"--n-icon-size":R,"--n-icon-margin":T,"--n-icon-margin-rtl":$,"--n-close-size":K,"--n-close-margin":Q,"--n-close-margin-rtl":G,"--n-padding":U,"--n-icon-margin-left":q,"--n-icon-margin-right":X}}),i=c?ne("alert",B(()=>e.type[0]),g,e):void 0,h=ge(!0),m=()=>{const{onAfterLeave:s,onAfterHide:r}=e;s&&s(),r&&r()};return{rtlEnabled:u,mergedClsPrefix:o,mergedBordered:t,visible:h,handleCloseClick:()=>{var s;Promise.resolve((s=e.onClose)===null||s===void 0?void 0:s.call(e)).then(r=>{r!==!1&&(h.value=!1)})},handleAfterLeave:()=>{m()},mergedTheme:l,cssVars:c?void 0:g,themeClass:i==null?void 0:i.themeClass,onRender:i==null?void 0:i.onRender}},render(){var e;return(e=this.onRender)===null||e===void 0||e.call(this),a(oe,{onAfterLeave:this.handleAfterLeave},{default:()=>{const{mergedClsPrefix:o,$slots:t}=this,c={class:[`${o}-alert`,this.themeClass,this.closable&&`${o}-alert--closable`,this.showIcon&&`${o}-alert--show-icon`,!this.title&&this.closable&&`${o}-alert--right-adjust`,this.rtlEnabled&&`${o}-alert--rtl`],style:this.cssVars,role:"alert"};return this.visible?a("div",Object.assign({},D(this.$attrs,c)),this.closable&&a(te,{clsPrefix:o,class:`${o}-alert__close`,onClick:this.handleCloseClick}),this.bordered&&a("div",{class:`${o}-alert__border`}),this.showIcon&&a("div",{class:`${o}-alert__icon`,"aria-hidden":"true"},se(t.icon,()=>[a(le,{clsPrefix:o},{default:()=>{switch(this.type){case"success":return a(de,null);case"info":return a(ce,null);case"warning":return a(ae,null);case"error":return a(ie,null);default:return null}}})])),a("div",{class:[`${o}-alert-body`,this.mergedBordered&&`${o}-alert-body--bordered`]},ue(t.header,n=>{const l=n||this.title;return l?a("div",{class:`${o}-alert-body__title`},l):null}),t.default&&a("div",{class:`${o}-alert-body__content`},t))):null}})}});function Pe(e){const{heightSmall:o,heightMedium:t,heightLarge:c,borderRadius:n}=e;return{color:"#eee",colorEnd:"#ddd",borderRadius:n,heightSmall:o,heightMedium:t,heightLarge:c}}const we={common:M,self:Pe},Re=A([k("skeleton",`
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
 `)]),Te=Object.assign(Object.assign({},_.props),{text:Boolean,round:Boolean,circle:Boolean,height:[String,Number],width:[String,Number],size:String,repeat:{type:Number,default:1},animated:{type:Boolean,default:!0},sharp:{type:Boolean,default:!0}}),$e=L({name:"Skeleton",inheritAttrs:!1,props:Te,setup(e){xe();const{mergedClsPrefixRef:o,mergedComponentPropsRef:t}=V(e),c=B(()=>{var l,u;return e.size||((u=(l=t==null?void 0:t.value)===null||l===void 0?void 0:l.Skeleton)===null||u===void 0?void 0:u.size)}),n=_("Skeleton","-skeleton",Re,we,e,o);return{mergedClsPrefix:o,style:B(()=>{var l,u;const g=n.value,{common:{cubicBezierEaseInOut:i}}=g,h=g.self,{color:m,colorEnd:C,borderRadius:p}=h;let s;const{circle:r,sharp:S,round:I,width:d,height:z,text:R,animated:T}=e,$=c.value;$!==void 0&&(s=h[b("height",$)]);const P=r?(l=d??z)!==null&&l!==void 0?l:s:d,w=(u=r?d??z:z)!==null&&u!==void 0?u:s;return{display:R?"inline-block":"",verticalAlign:R?"-0.125em":"",borderRadius:r?"50%":I?"4096px":S?"":p,width:typeof P=="number"?W(P):P,height:typeof w=="number"?W(w):w,animation:T?"":"none","--n-bezier":i,"--n-color-start":m,"--n-color-end":C}})}},render(){const{repeat:e,style:o,mergedClsPrefix:t,$attrs:c}=this,n=a("div",D({class:`${t}-skeleton`,style:o},c));return e>1?a(J,null,fe(e,null).map(l=>[n,`
`])):n}}),Ee=["aria-busy","role"],Be=L({__name:"LsAsyncState",props:{state:{},title:{default:""},description:{default:""},rows:{default:3}},setup(e){return(o,t)=>(E(),j("section",{class:"ls-async-state","aria-busy":e.state==="loading"||void 0,role:e.state==="error"?"alert":"status"},[e.state==="loading"?(E(!0),j(J,{key:0},be(e.rows,c=>(E(),O(N($e),{key:c,text:"",repeat:1}))),128)):(E(),O(N(ke),{key:1,type:"error",title:e.title||"暂时无法读取"},{default:ve(()=>[me(Ce(e.description||"请稍后再试；页面其他功能仍可继续使用。"),1)]),_:1},8,["title"]))],8,Ee))}}),He=pe(Be,[["__scopeId","data-v-f0c60eea"]]);export{He as L};

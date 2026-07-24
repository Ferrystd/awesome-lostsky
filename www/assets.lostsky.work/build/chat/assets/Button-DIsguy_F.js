import{b as $,a4 as wo,e as Z,a3 as To,aa as uo,a as Ho,d as zo,f as G,g as f,w as lo,ab as Eo,i as Bo,r as ao,a7 as Wo,k as Fo,a5 as Do,n as Io,m as Go,o as Ro,p as xo,q as ko,s as Oo,t as Mo,a9 as Lo,v as n,c as Y}from"./naive-theme-Bm9IVP_s.js";import{d as to,C as z,W as jo,T as _o,E as No,z as Ao,x as Ko,i as Q,D as Qo,v as U}from"./index-BvVWQ3cy.js";import{c as co}from"./color-to-class-B0iQgAn2.js";const Vo=to({name:"FadeInExpandTransition",props:{appear:Boolean,group:Boolean,mode:String,onLeave:Function,onAfterLeave:Function,onAfterEnter:Function,width:Boolean,reverse:Boolean},setup(o,{slots:v}){function C(t){o.width?t.style.maxWidth=`${t.offsetWidth}px`:t.style.maxHeight=`${t.offsetHeight}px`,t.offsetWidth}function u(t){o.width?t.style.maxWidth="0":t.style.maxHeight="0",t.offsetWidth;const{onLeave:x}=o;x&&x()}function g(t){o.width?t.style.maxWidth="":t.style.maxHeight="";const{onAfterLeave:x}=o;x&&x()}function R(t){if(t.style.transition="none",o.width){const x=t.offsetWidth;t.style.maxWidth="0",t.offsetWidth,t.style.transition="",t.style.maxWidth=`${x}px`}else if(o.reverse)t.style.maxHeight=`${t.offsetHeight}px`,t.offsetHeight,t.style.transition="",t.style.maxHeight="0";else{const x=t.offsetHeight;t.style.maxHeight="0",t.offsetWidth,t.style.transition="",t.style.maxHeight=`${x}px`}t.offsetWidth}function N(t){var x;o.width?t.style.maxWidth="":o.reverse||(t.style.maxHeight=""),(x=o.onAfterEnter)===null||x===void 0||x.call(o)}return()=>{const{group:t,width:x,appear:O,mode:M}=o,h=t?jo:_o,A={name:x?"fade-in-width-expand-transition":"fade-in-height-expand-transition",appear:O,onEnter:R,onAfterEnter:N,onBeforeLeave:C,onLeave:u,onAfterLeave:g};return t||(A.mode=M),z(h,A,v)}}}),{cubicBezierEaseInOut:k}=wo;function qo({duration:o=".2s",delay:v=".1s"}={}){return[$("&.fade-in-width-expand-transition-leave-from, &.fade-in-width-expand-transition-enter-to",{opacity:1}),$("&.fade-in-width-expand-transition-leave-to, &.fade-in-width-expand-transition-enter-from",`
 opacity: 0!important;
 margin-left: 0!important;
 margin-right: 0!important;
 `),$("&.fade-in-width-expand-transition-leave-active",`
 overflow: hidden;
 transition:
 opacity ${o} ${k},
 max-width ${o} ${k} ${v},
 margin-left ${o} ${k} ${v},
 margin-right ${o} ${k} ${v};
 `),$("&.fade-in-width-expand-transition-enter-active",`
 overflow: hidden;
 transition:
 opacity ${o} ${k} ${v},
 max-width ${o} ${k},
 margin-left ${o} ${k},
 margin-right ${o} ${k};
 `)]}const Xo=Z("base-wave",`
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 border-radius: inherit;
`),Yo=to({name:"BaseWave",props:{clsPrefix:{type:String,required:!0}},setup(o){To("-base-wave",Xo,No(o,"clsPrefix"));const v=Q(null),C=Q(!1);let u=null;return Ao(()=>{u!==null&&window.clearTimeout(u)}),{active:C,selfRef:v,play(){u!==null&&(window.clearTimeout(u),C.value=!1,u=null),Ko(()=>{var g;(g=v.value)===null||g===void 0||g.offsetHeight,C.value=!0,u=window.setTimeout(()=>{C.value=!1,u=null},1e3)})}}},render(){const{clsPrefix:o}=this;return z("div",{ref:"selfRef","aria-hidden":!0,class:[`${o}-base-wave`,this.active&&`${o}-base-wave--active`]})}});function _(o){return uo(o,[255,255,255,.16])}function J(o){return uo(o,[0,0,0,.12])}const Uo=Ho("n-button-group"),Jo={paddingTiny:"0 6px",paddingSmall:"0 10px",paddingMedium:"0 14px",paddingLarge:"0 18px",paddingRoundTiny:"0 10px",paddingRoundSmall:"0 14px",paddingRoundMedium:"0 18px",paddingRoundLarge:"0 22px",iconMarginTiny:"6px",iconMarginSmall:"6px",iconMarginMedium:"6px",iconMarginLarge:"6px",iconSizeTiny:"14px",iconSizeSmall:"18px",iconSizeMedium:"18px",iconSizeLarge:"20px",rippleDuration:".6s"};function Zo(o){const{heightTiny:v,heightSmall:C,heightMedium:u,heightLarge:g,borderRadius:R,fontSizeTiny:N,fontSizeSmall:t,fontSizeMedium:x,fontSizeLarge:O,opacityDisabled:M,textColor2:h,textColor3:A,primaryColorHover:b,primaryColorPressed:F,borderColor:V,primaryColor:E,baseColor:i,infoColor:D,infoColorHover:B,infoColorPressed:W,successColor:r,successColorHover:l,successColorPressed:m,warningColor:e,warningColorHover:y,warningColorPressed:w,errorColor:P,errorColorHover:T,errorColorPressed:S,fontWeight:K,buttonColor2:I,buttonColor2Hover:L,buttonColor2Pressed:H,fontWeightStrong:a}=o;return Object.assign(Object.assign({},Jo),{heightTiny:v,heightSmall:C,heightMedium:u,heightLarge:g,borderRadiusTiny:R,borderRadiusSmall:R,borderRadiusMedium:R,borderRadiusLarge:R,fontSizeTiny:N,fontSizeSmall:t,fontSizeMedium:x,fontSizeLarge:O,opacityDisabled:M,colorOpacitySecondary:"0.16",colorOpacitySecondaryHover:"0.22",colorOpacitySecondaryPressed:"0.28",colorSecondary:I,colorSecondaryHover:L,colorSecondaryPressed:H,colorTertiary:I,colorTertiaryHover:L,colorTertiaryPressed:H,colorQuaternary:"#0000",colorQuaternaryHover:L,colorQuaternaryPressed:H,color:"#0000",colorHover:"#0000",colorPressed:"#0000",colorFocus:"#0000",colorDisabled:"#0000",textColor:h,textColorTertiary:A,textColorHover:b,textColorPressed:F,textColorFocus:b,textColorDisabled:h,textColorText:h,textColorTextHover:b,textColorTextPressed:F,textColorTextFocus:b,textColorTextDisabled:h,textColorGhost:h,textColorGhostHover:b,textColorGhostPressed:F,textColorGhostFocus:b,textColorGhostDisabled:h,border:`1px solid ${V}`,borderHover:`1px solid ${b}`,borderPressed:`1px solid ${F}`,borderFocus:`1px solid ${b}`,borderDisabled:`1px solid ${V}`,rippleColor:E,colorPrimary:E,colorHoverPrimary:b,colorPressedPrimary:F,colorFocusPrimary:b,colorDisabledPrimary:E,textColorPrimary:i,textColorHoverPrimary:i,textColorPressedPrimary:i,textColorFocusPrimary:i,textColorDisabledPrimary:i,textColorTextPrimary:E,textColorTextHoverPrimary:b,textColorTextPressedPrimary:F,textColorTextFocusPrimary:b,textColorTextDisabledPrimary:h,textColorGhostPrimary:E,textColorGhostHoverPrimary:b,textColorGhostPressedPrimary:F,textColorGhostFocusPrimary:b,textColorGhostDisabledPrimary:E,borderPrimary:`1px solid ${E}`,borderHoverPrimary:`1px solid ${b}`,borderPressedPrimary:`1px solid ${F}`,borderFocusPrimary:`1px solid ${b}`,borderDisabledPrimary:`1px solid ${E}`,rippleColorPrimary:E,colorInfo:D,colorHoverInfo:B,colorPressedInfo:W,colorFocusInfo:B,colorDisabledInfo:D,textColorInfo:i,textColorHoverInfo:i,textColorPressedInfo:i,textColorFocusInfo:i,textColorDisabledInfo:i,textColorTextInfo:D,textColorTextHoverInfo:B,textColorTextPressedInfo:W,textColorTextFocusInfo:B,textColorTextDisabledInfo:h,textColorGhostInfo:D,textColorGhostHoverInfo:B,textColorGhostPressedInfo:W,textColorGhostFocusInfo:B,textColorGhostDisabledInfo:D,borderInfo:`1px solid ${D}`,borderHoverInfo:`1px solid ${B}`,borderPressedInfo:`1px solid ${W}`,borderFocusInfo:`1px solid ${B}`,borderDisabledInfo:`1px solid ${D}`,rippleColorInfo:D,colorSuccess:r,colorHoverSuccess:l,colorPressedSuccess:m,colorFocusSuccess:l,colorDisabledSuccess:r,textColorSuccess:i,textColorHoverSuccess:i,textColorPressedSuccess:i,textColorFocusSuccess:i,textColorDisabledSuccess:i,textColorTextSuccess:r,textColorTextHoverSuccess:l,textColorTextPressedSuccess:m,textColorTextFocusSuccess:l,textColorTextDisabledSuccess:h,textColorGhostSuccess:r,textColorGhostHoverSuccess:l,textColorGhostPressedSuccess:m,textColorGhostFocusSuccess:l,textColorGhostDisabledSuccess:r,borderSuccess:`1px solid ${r}`,borderHoverSuccess:`1px solid ${l}`,borderPressedSuccess:`1px solid ${m}`,borderFocusSuccess:`1px solid ${l}`,borderDisabledSuccess:`1px solid ${r}`,rippleColorSuccess:r,colorWarning:e,colorHoverWarning:y,colorPressedWarning:w,colorFocusWarning:y,colorDisabledWarning:e,textColorWarning:i,textColorHoverWarning:i,textColorPressedWarning:i,textColorFocusWarning:i,textColorDisabledWarning:i,textColorTextWarning:e,textColorTextHoverWarning:y,textColorTextPressedWarning:w,textColorTextFocusWarning:y,textColorTextDisabledWarning:h,textColorGhostWarning:e,textColorGhostHoverWarning:y,textColorGhostPressedWarning:w,textColorGhostFocusWarning:y,textColorGhostDisabledWarning:e,borderWarning:`1px solid ${e}`,borderHoverWarning:`1px solid ${y}`,borderPressedWarning:`1px solid ${w}`,borderFocusWarning:`1px solid ${y}`,borderDisabledWarning:`1px solid ${e}`,rippleColorWarning:e,colorError:P,colorHoverError:T,colorPressedError:S,colorFocusError:T,colorDisabledError:P,textColorError:i,textColorHoverError:i,textColorPressedError:i,textColorFocusError:i,textColorDisabledError:i,textColorTextError:P,textColorTextHoverError:T,textColorTextPressedError:S,textColorTextFocusError:T,textColorTextDisabledError:h,textColorGhostError:P,textColorGhostHoverError:T,textColorGhostPressedError:S,textColorGhostFocusError:T,textColorGhostDisabledError:P,borderError:`1px solid ${P}`,borderHoverError:`1px solid ${T}`,borderPressedError:`1px solid ${S}`,borderFocusError:`1px solid ${T}`,borderDisabledError:`1px solid ${P}`,rippleColorError:P,waveOpacity:"0.6",fontWeight:K,fontWeightStrong:a})}const oe={name:"Button",common:zo,self:Zo},ee=$([Z("button",`
 margin: 0;
 font-weight: var(--n-font-weight);
 line-height: 1;
 font-family: inherit;
 padding: var(--n-padding);
 height: var(--n-height);
 font-size: var(--n-font-size);
 border-radius: var(--n-border-radius);
 color: var(--n-text-color);
 background-color: var(--n-color);
 width: var(--n-width);
 white-space: nowrap;
 outline: none;
 position: relative;
 z-index: auto;
 border: none;
 display: inline-flex;
 flex-wrap: nowrap;
 flex-shrink: 0;
 align-items: center;
 justify-content: center;
 user-select: none;
 -webkit-user-select: none;
 text-align: center;
 cursor: pointer;
 text-decoration: none;
 transition:
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 opacity .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 `,[G("color",[f("border",{borderColor:"var(--n-border-color)"}),G("disabled",[f("border",{borderColor:"var(--n-border-color-disabled)"})]),lo("disabled",[$("&:focus",[f("state-border",{borderColor:"var(--n-border-color-focus)"})]),$("&:hover",[f("state-border",{borderColor:"var(--n-border-color-hover)"})]),$("&:active",[f("state-border",{borderColor:"var(--n-border-color-pressed)"})]),G("pressed",[f("state-border",{borderColor:"var(--n-border-color-pressed)"})])])]),G("disabled",{backgroundColor:"var(--n-color-disabled)",color:"var(--n-text-color-disabled)"},[f("border",{border:"var(--n-border-disabled)"})]),lo("disabled",[$("&:focus",{backgroundColor:"var(--n-color-focus)",color:"var(--n-text-color-focus)"},[f("state-border",{border:"var(--n-border-focus)"})]),$("&:hover",{backgroundColor:"var(--n-color-hover)",color:"var(--n-text-color-hover)"},[f("state-border",{border:"var(--n-border-hover)"})]),$("&:active",{backgroundColor:"var(--n-color-pressed)",color:"var(--n-text-color-pressed)"},[f("state-border",{border:"var(--n-border-pressed)"})]),G("pressed",{backgroundColor:"var(--n-color-pressed)",color:"var(--n-text-color-pressed)"},[f("state-border",{border:"var(--n-border-pressed)"})])]),G("loading","cursor: wait;"),Z("base-wave",`
 pointer-events: none;
 top: 0;
 right: 0;
 bottom: 0;
 left: 0;
 animation-iteration-count: 1;
 animation-duration: var(--n-ripple-duration);
 animation-timing-function: var(--n-bezier-ease-out), var(--n-bezier-ease-out);
 `,[G("active",{zIndex:1,animationName:"button-wave-spread, button-wave-opacity"})]),Eo&&"MozBoxSizing"in document.createElement("div").style?$("&::moz-focus-inner",{border:0}):null,f("border, state-border",`
 position: absolute;
 left: 0;
 top: 0;
 right: 0;
 bottom: 0;
 border-radius: inherit;
 transition: border-color .3s var(--n-bezier);
 pointer-events: none;
 `),f("border",`
 border: var(--n-border);
 `),f("state-border",`
 border: var(--n-border);
 border-color: #0000;
 z-index: 1;
 `),f("icon",`
 margin: var(--n-icon-margin);
 margin-left: 0;
 height: var(--n-icon-size);
 width: var(--n-icon-size);
 max-width: var(--n-icon-size);
 font-size: var(--n-icon-size);
 position: relative;
 flex-shrink: 0;
 `,[Z("icon-slot",`
 height: var(--n-icon-size);
 width: var(--n-icon-size);
 position: absolute;
 left: 0;
 top: 50%;
 transform: translateY(-50%);
 display: flex;
 align-items: center;
 justify-content: center;
 `,[Bo({top:"50%",originalTransform:"translateY(-50%)"})]),qo()]),f("content",`
 display: flex;
 align-items: center;
 flex-wrap: nowrap;
 min-width: 0;
 `,[$("~",[f("icon",{margin:"var(--n-icon-margin)",marginRight:0})])]),G("block",`
 display: flex;
 width: 100%;
 `),G("dashed",[f("border, state-border",{borderStyle:"dashed !important"})]),G("disabled",{cursor:"not-allowed",opacity:"var(--n-opacity-disabled)"})]),$("@keyframes button-wave-spread",{from:{boxShadow:"0 0 0.5px 0 var(--n-ripple-color)"},to:{boxShadow:"0 0 0.5px 4.5px var(--n-ripple-color)"}}),$("@keyframes button-wave-opacity",{from:{opacity:"var(--n-wave-opacity)"},to:{opacity:0}})]),re=Object.assign(Object.assign({},xo.props),{color:String,textColor:String,text:Boolean,block:Boolean,loading:Boolean,disabled:Boolean,circle:Boolean,size:String,ghost:Boolean,round:Boolean,secondary:Boolean,tertiary:Boolean,quaternary:Boolean,strong:Boolean,focusable:{type:Boolean,default:!0},keyboard:{type:Boolean,default:!0},tag:{type:String,default:"button"},type:{type:String,default:"default"},dashed:Boolean,renderIcon:Function,iconPlacement:{type:String,default:"left"},attrType:{type:String,default:"button"},bordered:{type:Boolean,default:!0},onClick:[Function,Array],nativeFocusBehavior:{type:Boolean,default:!Lo},spinProps:Object}),te=to({name:"Button",props:re,slots:Object,setup(o){const v=Q(null),C=Q(null),u=Q(!1),g=Io(()=>!o.quaternary&&!o.tertiary&&!o.secondary&&!o.text&&(!o.color||o.ghost||o.dashed)&&o.bordered),R=Qo(Uo,{}),{inlineThemeDisabled:N,mergedClsPrefixRef:t,mergedRtlRef:x,mergedComponentPropsRef:O}=Go(o),{mergedSizeRef:M}=Ro({},{defaultSize:"medium",mergedSize:r=>{var l,m;const{size:e}=o;if(e)return e;const{size:y}=R;if(y)return y;const{mergedSize:w}=r||{};if(w)return w.value;const P=(m=(l=O==null?void 0:O.value)===null||l===void 0?void 0:l.Button)===null||m===void 0?void 0:m.size;return P||"medium"}}),h=U(()=>o.focusable&&!o.disabled),A=r=>{var l;h.value||r.preventDefault(),!o.nativeFocusBehavior&&(r.preventDefault(),!o.disabled&&h.value&&((l=v.value)===null||l===void 0||l.focus({preventScroll:!0})))},b=r=>{var l;if(!o.disabled&&!o.loading){const{onClick:m}=o;m&&Mo(m,r),o.text||(l=C.value)===null||l===void 0||l.play()}},F=r=>{switch(r.key){case"Enter":if(!o.keyboard)return;u.value=!1}},V=r=>{switch(r.key){case"Enter":if(!o.keyboard||o.loading){r.preventDefault();return}u.value=!0}},E=()=>{u.value=!1},i=xo("Button","-button",ee,oe,o,t),D=ko("Button",x,t),B=U(()=>{const r=i.value,{common:{cubicBezierEaseInOut:l,cubicBezierEaseOut:m},self:e}=r,{rippleDuration:y,opacityDisabled:w,fontWeight:P,fontWeightStrong:T}=e,S=M.value,{dashed:K,type:I,ghost:L,text:H,color:a,round:no,circle:oo,textColor:j,secondary:bo,tertiary:so,quaternary:fo,strong:ho}=o,vo={"--n-font-weight":ho?T:P};let d={"--n-color":"initial","--n-color-hover":"initial","--n-color-pressed":"initial","--n-color-focus":"initial","--n-color-disabled":"initial","--n-ripple-color":"initial","--n-text-color":"initial","--n-text-color-hover":"initial","--n-text-color-pressed":"initial","--n-text-color-focus":"initial","--n-text-color-disabled":"initial"};const q=I==="tertiary",io=I==="default",s=q?"default":I;if(H){const c=j||a;d={"--n-color":"#0000","--n-color-hover":"#0000","--n-color-pressed":"#0000","--n-color-focus":"#0000","--n-color-disabled":"#0000","--n-ripple-color":"#0000","--n-text-color":c||e[n("textColorText",s)],"--n-text-color-hover":c?_(c):e[n("textColorTextHover",s)],"--n-text-color-pressed":c?J(c):e[n("textColorTextPressed",s)],"--n-text-color-focus":c?_(c):e[n("textColorTextHover",s)],"--n-text-color-disabled":c||e[n("textColorTextDisabled",s)]}}else if(L||K){const c=j||a;d={"--n-color":"#0000","--n-color-hover":"#0000","--n-color-pressed":"#0000","--n-color-focus":"#0000","--n-color-disabled":"#0000","--n-ripple-color":a||e[n("rippleColor",s)],"--n-text-color":c||e[n("textColorGhost",s)],"--n-text-color-hover":c?_(c):e[n("textColorGhostHover",s)],"--n-text-color-pressed":c?J(c):e[n("textColorGhostPressed",s)],"--n-text-color-focus":c?_(c):e[n("textColorGhostHover",s)],"--n-text-color-disabled":c||e[n("textColorGhostDisabled",s)]}}else if(bo){const c=io?e.textColor:q?e.textColorTertiary:e[n("color",s)],p=a||c,X=I!=="default"&&I!=="tertiary";d={"--n-color":X?Y(p,{alpha:Number(e.colorOpacitySecondary)}):e.colorSecondary,"--n-color-hover":X?Y(p,{alpha:Number(e.colorOpacitySecondaryHover)}):e.colorSecondaryHover,"--n-color-pressed":X?Y(p,{alpha:Number(e.colorOpacitySecondaryPressed)}):e.colorSecondaryPressed,"--n-color-focus":X?Y(p,{alpha:Number(e.colorOpacitySecondaryHover)}):e.colorSecondaryHover,"--n-color-disabled":e.colorSecondary,"--n-ripple-color":"#0000","--n-text-color":p,"--n-text-color-hover":p,"--n-text-color-pressed":p,"--n-text-color-focus":p,"--n-text-color-disabled":p}}else if(so||fo){const c=io?e.textColor:q?e.textColorTertiary:e[n("color",s)],p=a||c;so?(d["--n-color"]=e.colorTertiary,d["--n-color-hover"]=e.colorTertiaryHover,d["--n-color-pressed"]=e.colorTertiaryPressed,d["--n-color-focus"]=e.colorSecondaryHover,d["--n-color-disabled"]=e.colorTertiary):(d["--n-color"]=e.colorQuaternary,d["--n-color-hover"]=e.colorQuaternaryHover,d["--n-color-pressed"]=e.colorQuaternaryPressed,d["--n-color-focus"]=e.colorQuaternaryHover,d["--n-color-disabled"]=e.colorQuaternary),d["--n-ripple-color"]="#0000",d["--n-text-color"]=p,d["--n-text-color-hover"]=p,d["--n-text-color-pressed"]=p,d["--n-text-color-focus"]=p,d["--n-text-color-disabled"]=p}else d={"--n-color":a||e[n("color",s)],"--n-color-hover":a?_(a):e[n("colorHover",s)],"--n-color-pressed":a?J(a):e[n("colorPressed",s)],"--n-color-focus":a?_(a):e[n("colorFocus",s)],"--n-color-disabled":a||e[n("colorDisabled",s)],"--n-ripple-color":a||e[n("rippleColor",s)],"--n-text-color":j||(a?e.textColorPrimary:q?e.textColorTertiary:e[n("textColor",s)]),"--n-text-color-hover":j||(a?e.textColorHoverPrimary:e[n("textColorHover",s)]),"--n-text-color-pressed":j||(a?e.textColorPressedPrimary:e[n("textColorPressed",s)]),"--n-text-color-focus":j||(a?e.textColorFocusPrimary:e[n("textColorFocus",s)]),"--n-text-color-disabled":j||(a?e.textColorDisabledPrimary:e[n("textColorDisabled",s)])};let eo={"--n-border":"initial","--n-border-hover":"initial","--n-border-pressed":"initial","--n-border-focus":"initial","--n-border-disabled":"initial"};H?eo={"--n-border":"none","--n-border-hover":"none","--n-border-pressed":"none","--n-border-focus":"none","--n-border-disabled":"none"}:eo={"--n-border":e[n("border",s)],"--n-border-hover":e[n("borderHover",s)],"--n-border-pressed":e[n("borderPressed",s)],"--n-border-focus":e[n("borderFocus",s)],"--n-border-disabled":e[n("borderDisabled",s)]};const{[n("height",S)]:ro,[n("fontSize",S)]:po,[n("padding",S)]:Co,[n("paddingRound",S)]:go,[n("iconSize",S)]:mo,[n("borderRadius",S)]:yo,[n("iconMargin",S)]:Po,waveOpacity:So}=e,$o={"--n-width":oo&&!H?ro:"initial","--n-height":H?"initial":ro,"--n-font-size":po,"--n-padding":oo||H?"initial":no?go:Co,"--n-icon-size":mo,"--n-icon-margin":Po,"--n-border-radius":H?"initial":oo||no?ro:yo};return Object.assign(Object.assign(Object.assign(Object.assign({"--n-bezier":l,"--n-bezier-ease-out":m,"--n-ripple-duration":y,"--n-opacity-disabled":w,"--n-wave-opacity":So},vo),d),eo),$o)}),W=N?Oo("button",U(()=>{let r="";const{dashed:l,type:m,ghost:e,text:y,color:w,round:P,circle:T,textColor:S,secondary:K,tertiary:I,quaternary:L,strong:H}=o;l&&(r+="a"),e&&(r+="b"),y&&(r+="c"),P&&(r+="d"),T&&(r+="e"),K&&(r+="f"),I&&(r+="g"),L&&(r+="h"),H&&(r+="i"),w&&(r+=`j${co(w)}`),S&&(r+=`k${co(S)}`);const{value:a}=M;return r+=`l${a[0]}`,r+=`m${m[0]}`,r}),B,o):void 0;return{selfElRef:v,waveElRef:C,mergedClsPrefix:t,mergedFocusable:h,mergedSize:M,showBorder:g,enterPressed:u,rtlEnabled:D,handleMousedown:A,handleKeydown:V,handleBlur:E,handleKeyup:F,handleClick:b,customColorCssVars:U(()=>{const{color:r}=o;if(!r)return null;const l=_(r);return{"--n-border-color":r,"--n-border-color-hover":l,"--n-border-color-pressed":J(r),"--n-border-color-focus":l,"--n-border-color-disabled":r}}),cssVars:N?void 0:B,themeClass:W==null?void 0:W.themeClass,onRender:W==null?void 0:W.onRender}},render(){const{mergedClsPrefix:o,tag:v,onRender:C}=this;C==null||C();const u=ao(this.$slots.default,g=>g&&z("span",{class:`${o}-button__content`},g));return z(v,{ref:"selfElRef",class:[this.themeClass,`${o}-button`,`${o}-button--${this.type}-type`,`${o}-button--${this.mergedSize}-type`,this.rtlEnabled&&`${o}-button--rtl`,this.disabled&&`${o}-button--disabled`,this.block&&`${o}-button--block`,this.enterPressed&&`${o}-button--pressed`,!this.text&&this.dashed&&`${o}-button--dashed`,this.color&&`${o}-button--color`,this.secondary&&`${o}-button--secondary`,this.loading&&`${o}-button--loading`,this.ghost&&`${o}-button--ghost`],tabindex:this.mergedFocusable?0:-1,type:this.attrType,style:this.cssVars,disabled:this.disabled,onClick:this.handleClick,onBlur:this.handleBlur,onMousedown:this.handleMousedown,onKeyup:this.handleKeyup,onKeydown:this.handleKeydown},this.iconPlacement==="right"&&u,z(Vo,{width:!0},{default:()=>ao(this.$slots.icon,g=>(this.loading||this.renderIcon||g)&&z("span",{class:`${o}-button__icon`,style:{margin:Wo(this.$slots.default)?"0":""}},z(Fo,null,{default:()=>this.loading?z(Do,Object.assign({clsPrefix:o,key:"loading",class:`${o}-icon-slot`,strokeWidth:20},this.spinProps)):z("div",{key:"icon",class:`${o}-icon-slot`,role:"none"},this.renderIcon?this.renderIcon():g)})))}),this.iconPlacement==="left"&&u,this.text?null:z(Yo,{ref:"waveElRef",clsPrefix:o}),this.showBorder?z("div",{"aria-hidden":!0,class:`${o}-button__border`,style:this.customColorCssVars}):null,this.showBorder?z("div",{"aria-hidden":!0,class:`${o}-button__state-border`,style:this.customColorCssVars}):null)}}),le=te;export{te as B,le as X,oe as b};

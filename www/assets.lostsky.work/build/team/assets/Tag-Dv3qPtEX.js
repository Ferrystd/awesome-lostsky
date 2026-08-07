import{aD as so,aR as e,au as to,av as u,aS as m,aT as S,aw as I,d as io,aC as U,M as x,aU as ho,ax as go,ay as L,aV as Co,aG as bo,E as vo,aW as uo,j as O,aK as d,aX as po,aY as D,aA as fo,aZ as ko,a_ as mo}from"./index-Dqog-9fj.js";const xo={closeIconSizeTiny:"12px",closeIconSizeSmall:"12px",closeIconSizeMedium:"14px",closeIconSizeLarge:"14px",closeSizeTiny:"16px",closeSizeSmall:"16px",closeSizeMedium:"18px",closeSizeLarge:"18px",padding:"0 7px",closeMargin:"0 0 0 4px"};function zo(a){const{textColor2:g,primaryColorHover:r,primaryColorPressed:p,primaryColor:c,infoColor:i,successColor:n,warningColor:s,errorColor:t,baseColor:f,borderColor:k,opacityDisabled:C,tagColor:P,closeIconColor:z,closeIconColorHover:v,closeIconColorPressed:o,borderRadiusSmall:l,fontSizeMini:b,fontSizeTiny:h,fontSizeSmall:B,fontSizeMedium:$,heightMini:H,heightTiny:R,heightSmall:M,heightMedium:T,closeColorHover:_,closeColorPressed:E,buttonColor2Hover:W,buttonColor2Pressed:j,fontWeightStrong:w}=a;return Object.assign(Object.assign({},xo),{closeBorderRadius:l,heightTiny:H,heightSmall:R,heightMedium:M,heightLarge:T,borderRadius:l,opacityDisabled:C,fontSizeTiny:b,fontSizeSmall:h,fontSizeMedium:B,fontSizeLarge:$,fontWeightStrong:w,textColorCheckable:g,textColorHoverCheckable:g,textColorPressedCheckable:g,textColorChecked:f,colorCheckable:"#0000",colorHoverCheckable:W,colorPressedCheckable:j,colorChecked:c,colorCheckedHover:r,colorCheckedPressed:p,border:`1px solid ${k}`,textColor:g,color:P,colorBordered:"rgb(250, 250, 252)",closeIconColor:z,closeIconColorHover:v,closeIconColorPressed:o,closeColorHover:_,closeColorPressed:E,borderPrimary:`1px solid ${e(c,{alpha:.3})}`,textColorPrimary:c,colorPrimary:e(c,{alpha:.12}),colorBorderedPrimary:e(c,{alpha:.1}),closeIconColorPrimary:c,closeIconColorHoverPrimary:c,closeIconColorPressedPrimary:c,closeColorHoverPrimary:e(c,{alpha:.12}),closeColorPressedPrimary:e(c,{alpha:.18}),borderInfo:`1px solid ${e(i,{alpha:.3})}`,textColorInfo:i,colorInfo:e(i,{alpha:.12}),colorBorderedInfo:e(i,{alpha:.1}),closeIconColorInfo:i,closeIconColorHoverInfo:i,closeIconColorPressedInfo:i,closeColorHoverInfo:e(i,{alpha:.12}),closeColorPressedInfo:e(i,{alpha:.18}),borderSuccess:`1px solid ${e(n,{alpha:.3})}`,textColorSuccess:n,colorSuccess:e(n,{alpha:.12}),colorBorderedSuccess:e(n,{alpha:.1}),closeIconColorSuccess:n,closeIconColorHoverSuccess:n,closeIconColorPressedSuccess:n,closeColorHoverSuccess:e(n,{alpha:.12}),closeColorPressedSuccess:e(n,{alpha:.18}),borderWarning:`1px solid ${e(s,{alpha:.35})}`,textColorWarning:s,colorWarning:e(s,{alpha:.15}),colorBorderedWarning:e(s,{alpha:.12}),closeIconColorWarning:s,closeIconColorHoverWarning:s,closeIconColorPressedWarning:s,closeColorHoverWarning:e(s,{alpha:.12}),closeColorPressedWarning:e(s,{alpha:.18}),borderError:`1px solid ${e(t,{alpha:.23})}`,textColorError:t,colorError:e(t,{alpha:.1}),colorBorderedError:e(t,{alpha:.08}),closeIconColorError:t,closeIconColorHoverError:t,closeIconColorPressedError:t,closeColorHoverError:e(t,{alpha:.12}),closeColorPressedError:e(t,{alpha:.18})})}const yo={common:so,self:zo},So={color:Object,type:{type:String,default:"default"},round:Boolean,size:String,closable:Boolean,disabled:{type:Boolean,default:void 0}},Io=to("tag",`
 --n-close-margin: var(--n-close-margin-top) var(--n-close-margin-right) var(--n-close-margin-bottom) var(--n-close-margin-left);
 white-space: nowrap;
 position: relative;
 box-sizing: border-box;
 cursor: default;
 display: inline-flex;
 align-items: center;
 flex-wrap: nowrap;
 padding: var(--n-padding);
 border-radius: var(--n-border-radius);
 color: var(--n-text-color);
 background-color: var(--n-color);
 transition: 
 border-color .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier),
 opacity .3s var(--n-bezier);
 line-height: 1;
 height: var(--n-height);
 font-size: var(--n-font-size);
`,[u("strong",`
 font-weight: var(--n-font-weight-strong);
 `),m("border",`
 pointer-events: none;
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 border-radius: inherit;
 border: var(--n-border);
 transition: border-color .3s var(--n-bezier);
 `),m("icon",`
 display: flex;
 margin: 0 4px 0 0;
 color: var(--n-text-color);
 transition: color .3s var(--n-bezier);
 font-size: var(--n-avatar-size-override);
 `),m("avatar",`
 display: flex;
 margin: 0 6px 0 0;
 `),m("close",`
 margin: var(--n-close-margin);
 transition:
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier);
 `),u("round",`
 padding: 0 calc(var(--n-height) / 3);
 border-radius: calc(var(--n-height) / 2);
 `,[m("icon",`
 margin: 0 4px 0 calc((var(--n-height) - 8px) / -2);
 `),m("avatar",`
 margin: 0 6px 0 calc((var(--n-height) - 8px) / -2);
 `),u("closable",`
 padding: 0 calc(var(--n-height) / 4) 0 calc(var(--n-height) / 3);
 `)]),u("icon, avatar",[u("round",`
 padding: 0 calc(var(--n-height) / 3) 0 calc(var(--n-height) / 2);
 `)]),u("disabled",`
 cursor: not-allowed !important;
 opacity: var(--n-opacity-disabled);
 `),u("checkable",`
 cursor: pointer;
 box-shadow: none;
 color: var(--n-text-color-checkable);
 background-color: var(--n-color-checkable);
 `,[S("disabled",[I("&:hover","background-color: var(--n-color-hover-checkable);",[S("checked","color: var(--n-text-color-hover-checkable);")]),I("&:active","background-color: var(--n-color-pressed-checkable);",[S("checked","color: var(--n-text-color-pressed-checkable);")])]),u("checked",`
 color: var(--n-text-color-checked);
 background-color: var(--n-color-checked);
 `,[S("disabled",[I("&:hover","background-color: var(--n-color-checked-hover);"),I("&:active","background-color: var(--n-color-checked-pressed);")])])])]),Po=Object.assign(Object.assign(Object.assign({},L.props),So),{bordered:{type:Boolean,default:void 0},checked:Boolean,checkable:Boolean,strong:Boolean,triggerClickOnClose:Boolean,onClose:[Array,Function],onMouseenter:Function,onMouseleave:Function,"onUpdate:checked":Function,onUpdateChecked:Function,internalCloseFocusable:{type:Boolean,default:!0},internalCloseIsButtonTag:{type:Boolean,default:!0},onCheckedChange:Function}),Bo=mo("n-tag"),Ho=io({name:"Tag",props:Po,slots:Object,setup(a){const g=vo(null),{mergedBorderedRef:r,mergedClsPrefixRef:p,inlineThemeDisabled:c,mergedRtlRef:i,mergedComponentPropsRef:n}=go(a),s=O(()=>{var o,l;return a.size||((l=(o=n==null?void 0:n.value)===null||o===void 0?void 0:o.Tag)===null||l===void 0?void 0:l.size)||"medium"}),t=L("Tag","-tag",Io,yo,a,p);fo(Bo,{roundRef:ko(a,"round")});function f(){if(!a.disabled&&a.checkable){const{checked:o,onCheckedChange:l,onUpdateChecked:b,"onUpdate:checked":h}=a;b&&b(!o),h&&h(!o),l&&l(!o)}}function k(o){if(a.triggerClickOnClose||o.stopPropagation(),!a.disabled){const{onClose:l}=a;l&&uo(l,o)}}const C={setTextContent(o){const{value:l}=g;l&&(l.textContent=o)}},P=Co("Tag",i,p),z=O(()=>{const{type:o,color:{color:l,textColor:b}={}}=a,h=s.value,{common:{cubicBezierEaseInOut:B},self:{padding:$,closeMargin:H,borderRadius:R,opacityDisabled:M,textColorCheckable:T,textColorHoverCheckable:_,textColorPressedCheckable:E,textColorChecked:W,colorCheckable:j,colorHoverCheckable:w,colorPressedCheckable:V,colorChecked:K,colorCheckedHover:A,colorCheckedPressed:G,closeBorderRadius:X,fontWeightStrong:Y,[d("colorBordered",o)]:Z,[d("closeSize",h)]:q,[d("closeIconSize",h)]:J,[d("fontSize",h)]:Q,[d("height",h)]:F,[d("color",o)]:oo,[d("textColor",o)]:eo,[d("border",o)]:ro,[d("closeIconColor",o)]:N,[d("closeIconColorHover",o)]:lo,[d("closeIconColorPressed",o)]:ao,[d("closeColorHover",o)]:co,[d("closeColorPressed",o)]:no}}=t.value,y=po(H);return{"--n-font-weight-strong":Y,"--n-avatar-size-override":`calc(${F} - 8px)`,"--n-bezier":B,"--n-border-radius":R,"--n-border":ro,"--n-close-icon-size":J,"--n-close-color-pressed":no,"--n-close-color-hover":co,"--n-close-border-radius":X,"--n-close-icon-color":N,"--n-close-icon-color-hover":lo,"--n-close-icon-color-pressed":ao,"--n-close-icon-color-disabled":N,"--n-close-margin-top":y.top,"--n-close-margin-right":y.right,"--n-close-margin-bottom":y.bottom,"--n-close-margin-left":y.left,"--n-close-size":q,"--n-color":l||(r.value?Z:oo),"--n-color-checkable":j,"--n-color-checked":K,"--n-color-checked-hover":A,"--n-color-checked-pressed":G,"--n-color-hover-checkable":w,"--n-color-pressed-checkable":V,"--n-font-size":Q,"--n-height":F,"--n-opacity-disabled":M,"--n-padding":$,"--n-text-color":b||eo,"--n-text-color-checkable":T,"--n-text-color-checked":W,"--n-text-color-hover-checkable":_,"--n-text-color-pressed-checkable":E}}),v=c?bo("tag",O(()=>{let o="";const{type:l,color:{color:b,textColor:h}={}}=a;return o+=l[0],o+=s.value[0],b&&(o+=`a${D(b)}`),h&&(o+=`b${D(h)}`),r.value&&(o+="c"),o}),z,a):void 0;return Object.assign(Object.assign({},C),{rtlEnabled:P,mergedClsPrefix:p,contentRef:g,mergedBordered:r,handleClick:f,handleCloseClick:k,cssVars:c?void 0:z,themeClass:v==null?void 0:v.themeClass,onRender:v==null?void 0:v.onRender})},render(){var a,g;const{mergedClsPrefix:r,rtlEnabled:p,closable:c,color:{borderColor:i}={},round:n,onRender:s,$slots:t}=this;s==null||s();const f=U(t.avatar,C=>C&&x("div",{class:`${r}-tag__avatar`},C)),k=U(t.icon,C=>C&&x("div",{class:`${r}-tag__icon`},C));return x("div",{class:[`${r}-tag`,this.themeClass,{[`${r}-tag--rtl`]:p,[`${r}-tag--strong`]:this.strong,[`${r}-tag--disabled`]:this.disabled,[`${r}-tag--checkable`]:this.checkable,[`${r}-tag--checked`]:this.checkable&&this.checked,[`${r}-tag--round`]:n,[`${r}-tag--avatar`]:f,[`${r}-tag--icon`]:k,[`${r}-tag--closable`]:c}],style:this.cssVars,onClick:this.handleClick,onMouseenter:this.onMouseenter,onMouseleave:this.onMouseleave},k||f,x("span",{class:`${r}-tag__content`,ref:"contentRef"},(g=(a=this.$slots).default)===null||g===void 0?void 0:g.call(a)),!this.checkable&&c?x(ho,{clsPrefix:r,class:`${r}-tag__close`,disabled:this.disabled,onClick:this.handleCloseClick,focusable:this.internalCloseFocusable,round:n,isButtonTag:this.internalCloseIsButtonTag,absolute:!0}):null,!this.checkable&&this.mergedBordered?x("div",{class:`${r}-tag__border`,style:{borderColor:i}}):null)}});export{Ho as N};

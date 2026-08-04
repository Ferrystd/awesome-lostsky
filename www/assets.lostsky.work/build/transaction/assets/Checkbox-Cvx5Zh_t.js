import{X as be,ao as ue,d as _,m as f,$ as H,av as K,M as I,ai as E,j as A,Y as he,ac as fe,a7 as U,a4 as d,ad as y,Z as c,ae as M,au as $,aT as ve,aU as ke,aV as me,ax as xe,aJ as ge,aD as pe,aw as Ce,a0 as L,ak as ye,a1 as ze,aY as we,a2 as Re,am as O}from"./index-D6e9QThi.js";function Be(e){return Object.keys(e)}function Ie(e,a=[],s){const u={};return Object.getOwnPropertyNames(e).forEach(i=>{a.includes(i)||(u[i]=e[i])}),Object.assign(u,s)}const Se={sizeSmall:"14px",sizeMedium:"16px",sizeLarge:"18px",labelPadding:"0 8px",labelFontWeight:"400"};function Te(e){const{baseColor:a,inputColorDisabled:s,cardColor:u,modalColor:z,popoverColor:i,textColorDisabled:k,borderColor:t,primaryColor:m,textColor2:n,fontSizeSmall:x,fontSizeMedium:b,fontSizeLarge:r,borderRadiusSmall:g,lineHeight:v}=e;return Object.assign(Object.assign({},Se),{labelLineHeight:v,fontSizeSmall:x,fontSizeMedium:b,fontSizeLarge:r,borderRadius:g,color:a,colorChecked:m,colorDisabled:s,colorDisabledChecked:s,colorTableHeader:u,colorTableHeaderModal:z,colorTableHeaderPopover:i,checkMarkColor:a,checkMarkColorDisabled:k,checkMarkColorDisabledChecked:k,border:`1px solid ${t}`,borderDisabled:`1px solid ${t}`,borderDisabledChecked:`1px solid ${t}`,borderChecked:`1px solid ${m}`,borderFocus:`1px solid ${m}`,boxShadowFocus:`0 0 0 2px ${ue(m,{alpha:.3})}`,textColor:n,textColorDisabled:k})}const De={name:"Checkbox",common:be,self:Te},V=he("n-checkbox-group"),$e={min:Number,max:Number,size:String,value:Array,defaultValue:{type:Array,default:null},disabled:{type:Boolean,default:void 0},"onUpdate:value":[Function,Array],onUpdateValue:[Function,Array],onChange:[Function,Array]},Ue=_({name:"CheckboxGroup",props:$e,setup(e){const{mergedClsPrefixRef:a}=H(e),s=K(e),{mergedSizeRef:u,mergedDisabledRef:z}=s,i=I(e.defaultValue),k=A(()=>e.value),t=E(k,i),m=A(()=>{var b;return((b=t.value)===null||b===void 0?void 0:b.length)||0}),n=A(()=>Array.isArray(t.value)?new Set(t.value):new Set);function x(b,r){const{nTriggerFormInput:g,nTriggerFormChange:v}=s,{onChange:l,"onUpdate:value":w,onUpdateValue:R}=e;if(Array.isArray(t.value)){const h=Array.from(t.value),j=h.findIndex(B=>B===r);b?~j||(h.push(r),R&&d(R,h,{actionType:"check",value:r}),w&&d(w,h,{actionType:"check",value:r}),g(),v(),i.value=h,l&&d(l,h)):~j&&(h.splice(j,1),R&&d(R,h,{actionType:"uncheck",value:r}),w&&d(w,h,{actionType:"uncheck",value:r}),l&&d(l,h),i.value=h,g(),v())}else b?(R&&d(R,[r],{actionType:"check",value:r}),w&&d(w,[r],{actionType:"check",value:r}),l&&d(l,[r]),i.value=[r],g(),v()):(R&&d(R,[],{actionType:"uncheck",value:r}),w&&d(w,[],{actionType:"uncheck",value:r}),l&&d(l,[]),i.value=[],g(),v())}return fe(V,{checkedCountRef:m,maxRef:U(e,"max"),minRef:U(e,"min"),valueSetRef:n,disabledRef:z,mergedSizeRef:u,toggleCheckbox:x}),{mergedClsPrefix:a}},render(){return f("div",{class:`${this.mergedClsPrefix}-checkbox-group`,role:"group"},this.$slots)}}),Me=()=>f("svg",{viewBox:"0 0 64 64",class:"check-icon"},f("path",{d:"M50.42,16.76L22.34,39.45l-8.1-11.46c-1.12-1.58-3.3-1.96-4.88-0.84c-1.58,1.12-1.95,3.3-0.84,4.88l10.26,14.51  c0.56,0.79,1.42,1.31,2.38,1.45c0.16,0.02,0.32,0.03,0.48,0.03c0.8,0,1.57-0.27,2.2-0.78l30.99-25.03c1.5-1.21,1.74-3.42,0.52-4.92  C54.13,15.78,51.93,15.55,50.42,16.76z"})),Fe=()=>f("svg",{viewBox:"0 0 100 100",class:"line-icon"},f("path",{d:"M80.2,55.5H21.4c-2.8,0-5.1-2.5-5.1-5.5l0,0c0-3,2.3-5.5,5.1-5.5h58.7c2.8,0,5.1,2.5,5.1,5.5l0,0C85.2,53.1,82.9,55.5,80.2,55.5z"})),Pe=y([c("checkbox",`
 font-size: var(--n-font-size);
 outline: none;
 cursor: pointer;
 display: inline-flex;
 flex-wrap: nowrap;
 align-items: flex-start;
 word-break: break-word;
 line-height: var(--n-size);
 --n-merged-color-table: var(--n-color-table);
 `,[M("show-label","line-height: var(--n-label-line-height);"),y("&:hover",[c("checkbox-box",[$("border","border: var(--n-border-checked);")])]),y("&:focus:not(:active)",[c("checkbox-box",[$("border",`
 border: var(--n-border-focus);
 box-shadow: var(--n-box-shadow-focus);
 `)])]),M("inside-table",[c("checkbox-box",`
 background-color: var(--n-merged-color-table);
 `)]),M("checked",[c("checkbox-box",`
 background-color: var(--n-color-checked);
 `,[c("checkbox-icon",[y(".check-icon",`
 opacity: 1;
 transform: scale(1);
 `)])])]),M("indeterminate",[c("checkbox-box",[c("checkbox-icon",[y(".check-icon",`
 opacity: 0;
 transform: scale(.5);
 `),y(".line-icon",`
 opacity: 1;
 transform: scale(1);
 `)])])]),M("checked, indeterminate",[y("&:focus:not(:active)",[c("checkbox-box",[$("border",`
 border: var(--n-border-checked);
 box-shadow: var(--n-box-shadow-focus);
 `)])]),c("checkbox-box",`
 background-color: var(--n-color-checked);
 border-left: 0;
 border-top: 0;
 `,[$("border",{border:"var(--n-border-checked)"})])]),M("disabled",{cursor:"not-allowed"},[M("checked",[c("checkbox-box",`
 background-color: var(--n-color-disabled-checked);
 `,[$("border",{border:"var(--n-border-disabled-checked)"}),c("checkbox-icon",[y(".check-icon, .line-icon",{fill:"var(--n-check-mark-color-disabled-checked)"})])])]),c("checkbox-box",`
 background-color: var(--n-color-disabled);
 `,[$("border",`
 border: var(--n-border-disabled);
 `),c("checkbox-icon",[y(".check-icon, .line-icon",`
 fill: var(--n-check-mark-color-disabled);
 `)])]),$("label",`
 color: var(--n-text-color-disabled);
 `)]),c("checkbox-box-wrapper",`
 position: relative;
 width: var(--n-size);
 flex-shrink: 0;
 flex-grow: 0;
 user-select: none;
 -webkit-user-select: none;
 `),c("checkbox-box",`
 position: absolute;
 left: 0;
 top: 50%;
 transform: translateY(-50%);
 height: var(--n-size);
 width: var(--n-size);
 display: inline-block;
 box-sizing: border-box;
 border-radius: var(--n-border-radius);
 background-color: var(--n-color);
 transition: background-color 0.3s var(--n-bezier);
 `,[$("border",`
 transition:
 border-color .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier);
 border-radius: inherit;
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 border: var(--n-border);
 `),c("checkbox-icon",`
 display: flex;
 align-items: center;
 justify-content: center;
 position: absolute;
 left: 1px;
 right: 1px;
 top: 1px;
 bottom: 1px;
 `,[y(".check-icon, .line-icon",`
 width: 100%;
 fill: var(--n-check-mark-color);
 opacity: 0;
 transform: scale(0.5);
 transform-origin: center;
 transition:
 fill 0.3s var(--n-bezier),
 transform 0.3s var(--n-bezier),
 opacity 0.3s var(--n-bezier),
 border-color 0.3s var(--n-bezier);
 `),ve({left:"1px",top:"1px"})])]),$("label",`
 color: var(--n-text-color);
 transition: color .3s var(--n-bezier);
 user-select: none;
 -webkit-user-select: none;
 padding: var(--n-label-padding);
 font-weight: var(--n-label-font-weight);
 `,[y("&:empty",{display:"none"})])]),ke(c("checkbox",`
 --n-merged-color-table: var(--n-color-table-modal);
 `)),me(c("checkbox",`
 --n-merged-color-table: var(--n-color-table-popover);
 `))]),je=Object.assign(Object.assign({},L.props),{size:String,checked:{type:[Boolean,String,Number],default:void 0},defaultChecked:{type:[Boolean,String,Number],default:!1},value:[String,Number],disabled:{type:Boolean,default:void 0},indeterminate:Boolean,label:String,focusable:{type:Boolean,default:!0},checkedValue:{type:[Boolean,String,Number],default:!0},uncheckedValue:{type:[Boolean,String,Number],default:!1},"onUpdate:checked":[Function,Array],onUpdateChecked:[Function,Array],privateInsideTable:Boolean,onChange:[Function,Array]}),Ne=_({name:"Checkbox",props:je,setup(e){const a=Re(V,null),s=I(null),{mergedClsPrefixRef:u,inlineThemeDisabled:z,mergedRtlRef:i,mergedComponentPropsRef:k}=H(e),t=I(e.defaultChecked),m=U(e,"checked"),n=E(m,t),x=Ce(()=>{if(a){const o=a.valueSetRef.value;return o&&e.value!==void 0?o.has(e.value):!1}else return n.value===e.checkedValue}),b=K(e,{mergedSize(o){var p,C;const{size:S}=e;if(S!==void 0)return S;if(a){const{value:D}=a.mergedSizeRef;if(D!==void 0)return D}if(o){const{mergedSize:D}=o;if(D!==void 0)return D.value}const T=(C=(p=k==null?void 0:k.value)===null||p===void 0?void 0:p.Checkbox)===null||C===void 0?void 0:C.size;return T||"medium"},mergedDisabled(o){const{disabled:p}=e;if(p!==void 0)return p;if(a){if(a.disabledRef.value)return!0;const{maxRef:{value:C},checkedCountRef:S}=a;if(C!==void 0&&S.value>=C&&!x.value)return!0;const{minRef:{value:T}}=a;if(T!==void 0&&S.value<=T&&x.value)return!0}return o?o.disabled.value:!1}}),{mergedDisabledRef:r,mergedSizeRef:g}=b,v=L("Checkbox","-checkbox",Pe,De,e,u);function l(o){if(a&&e.value!==void 0)a.toggleCheckbox(!x.value,e.value);else{const{onChange:p,"onUpdate:checked":C,onUpdateChecked:S}=e,{nTriggerFormInput:T,nTriggerFormChange:D}=b,P=x.value?e.uncheckedValue:e.checkedValue;C&&d(C,P,o),S&&d(S,P,o),p&&d(p,P,o),T(),D(),t.value=P}}function w(o){r.value||l(o)}function R(o){if(!r.value)switch(o.key){case" ":case"Enter":l(o)}}function h(o){switch(o.key){case" ":o.preventDefault()}}const j={focus:()=>{var o;(o=s.value)===null||o===void 0||o.focus()},blur:()=>{var o;(o=s.value)===null||o===void 0||o.blur()}},B=ye("Checkbox",i,u),N=A(()=>{const{value:o}=g,{common:{cubicBezierEaseInOut:p},self:{borderRadius:C,color:S,colorChecked:T,colorDisabled:D,colorTableHeader:P,colorTableHeaderModal:G,colorTableHeaderPopover:W,checkMarkColor:Y,checkMarkColorDisabled:J,border:X,borderFocus:Z,borderDisabled:q,borderChecked:Q,boxShadowFocus:ee,textColor:oe,textColorDisabled:re,checkMarkColorDisabledChecked:ae,colorDisabledChecked:ne,borderDisabledChecked:ce,labelPadding:le,labelLineHeight:ie,labelFontWeight:te,[O("fontSize",o)]:de,[O("size",o)]:se}}=v.value;return{"--n-label-line-height":ie,"--n-label-font-weight":te,"--n-size":se,"--n-bezier":p,"--n-border-radius":C,"--n-border":X,"--n-border-checked":Q,"--n-border-focus":Z,"--n-border-disabled":q,"--n-border-disabled-checked":ce,"--n-box-shadow-focus":ee,"--n-color":S,"--n-color-checked":T,"--n-color-table":P,"--n-color-table-modal":G,"--n-color-table-popover":W,"--n-color-disabled":D,"--n-color-disabled-checked":ne,"--n-text-color":oe,"--n-text-color-disabled":re,"--n-check-mark-color":Y,"--n-check-mark-color-disabled":J,"--n-check-mark-color-disabled-checked":ae,"--n-font-size":de,"--n-label-padding":le}}),F=z?ze("checkbox",A(()=>g.value[0]),N,e):void 0;return Object.assign(b,j,{rtlEnabled:B,selfRef:s,mergedClsPrefix:u,mergedDisabled:r,renderedChecked:x,mergedTheme:v,labelId:we(),handleClick:w,handleKeyUp:R,handleKeyDown:h,cssVars:z?void 0:N,themeClass:F==null?void 0:F.themeClass,onRender:F==null?void 0:F.onRender})},render(){var e;const{$slots:a,renderedChecked:s,mergedDisabled:u,indeterminate:z,privateInsideTable:i,cssVars:k,labelId:t,label:m,mergedClsPrefix:n,focusable:x,handleKeyUp:b,handleKeyDown:r,handleClick:g}=this;(e=this.onRender)===null||e===void 0||e.call(this);const v=xe(a.default,l=>m||l?f("span",{class:`${n}-checkbox__label`,id:t},m||l):null);return f("div",{ref:"selfRef",class:[`${n}-checkbox`,this.themeClass,this.rtlEnabled&&`${n}-checkbox--rtl`,s&&`${n}-checkbox--checked`,u&&`${n}-checkbox--disabled`,z&&`${n}-checkbox--indeterminate`,i&&`${n}-checkbox--inside-table`,v&&`${n}-checkbox--show-label`],tabindex:u||!x?void 0:0,role:"checkbox","aria-checked":z?"mixed":s,"aria-labelledby":t,style:k,onKeyup:b,onKeydown:r,onClick:g,onMousedown:()=>{ge("selectstart",window,l=>{l.preventDefault()},{once:!0})}},f("div",{class:`${n}-checkbox-box-wrapper`}," ",f("div",{class:`${n}-checkbox-box`},f(pe,null,{default:()=>this.indeterminate?f("div",{key:"indeterminate",class:`${n}-checkbox-icon`},Fe()):f("div",{key:"check",class:`${n}-checkbox-icon`},Me())}),f("div",{class:`${n}-checkbox-box__border`}))),v)}});export{Ne as N,Ue as a,De as c,Be as k,Ie as o};

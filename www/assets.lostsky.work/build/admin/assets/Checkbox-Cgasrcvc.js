var ae=o=>{throw TypeError(o)};var Y=(o,e,r)=>e.has(o)||ae("Cannot "+r);var u=(o,e,r)=>(Y(o,e,"read from private field"),r?r.call(o):e.get(o)),S=(o,e,r)=>e.has(o)?ae("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(o):e.set(o,r),x=(o,e,r,t)=>(Y(o,e,"write to private field"),t?t.call(o,r):e.set(o,r),r),O=(o,e,r)=>(Y(o,e,"access private method"),r);import{a1 as He,a2 as ie,a3 as Ie,a4 as Be,a5 as _e,p as ce,a6 as je,a7 as Ne,h as j,u as Ke,a8 as Le,a9 as Ge,A as Ve,aa as qe,d as he,v as z,G as be,J as fe,l as X,K as ve,ab as We,ac as Je,W as Z,R as C,C as T,D as v,ad as H,ae as A,af as Ye,ag as Xe,ah as Ze,E as eo,ai as oo,U as ro,M as to,H as ke,O as no,aj as so,ak as ao,al as io,am as le}from"./index-D6TI0MEm.js";import{Q as co,u as lo}from"./RetryState.vue_vue_type_script_setup_true_lang-Zp9AoSGD.js";function de(o,e){const r=new Set(e);return o.filter(t=>!r.has(t))}function uo(o,e,r){const t=o.slice(0);return t[e]=r,t}var N,y,K,I,w,F,G,V,q,W,k,ee,oe,me,re,te,ne,ue,ho=(ue=class extends He{constructor(e,r,t){super();S(this,k);S(this,N);S(this,y);S(this,K);S(this,I);S(this,w);S(this,F);S(this,G);S(this,V);S(this,q);S(this,W,[]);x(this,N,e),x(this,I,t),x(this,K,[]),x(this,w,[]),x(this,y,[]),this.setQueries(r)}onSubscribe(){this.listeners.size===1&&u(this,w).forEach(e=>{e.subscribe(r=>{O(this,k,te).call(this,e,r)})})}onUnsubscribe(){this.listeners.size||this.destroy()}destroy(){this.listeners=new Set,u(this,w).forEach(e=>{e.destroy()})}setQueries(e,r){x(this,K,e),x(this,I,r),ie.batch(()=>{const t=u(this,w),n=O(this,k,re).call(this,u(this,K));n.forEach(i=>i.observer.setOptions(i.defaultedQueryOptions));const s=n.map(i=>i.observer),a=s.map(i=>i.getCurrentResult()),h=t.length!==s.length,b=s.some((i,c)=>i!==t[c]),l=h||b,g=l?!0:a.some((i,c)=>{const f=u(this,y)[c];return!f||!Ie(i,f)});!l&&!g||(l&&(x(this,W,n),x(this,w,s)),x(this,y,a),this.hasListeners()&&(l&&(de(t,s).forEach(i=>{i.destroy()}),de(s,t).forEach(i=>{i.subscribe(c=>{O(this,k,te).call(this,i,c)})})),O(this,k,ne).call(this)))})}getCurrentResult(){return u(this,y)}getQueries(){return u(this,w).map(e=>e.getCurrentQuery())}getObservers(){return u(this,w)}getOptimisticResult(e,r){const t=O(this,k,re).call(this,e),n=t.map(a=>a.observer.getOptimisticResult(a.defaultedQueryOptions)),s=t.map(a=>a.defaultedQueryOptions.queryHash);return[n,a=>O(this,k,oe).call(this,a??n,r,s),()=>O(this,k,ee).call(this,n,t)]}},N=new WeakMap,y=new WeakMap,K=new WeakMap,I=new WeakMap,w=new WeakMap,F=new WeakMap,G=new WeakMap,V=new WeakMap,q=new WeakMap,W=new WeakMap,k=new WeakSet,ee=function(e,r){return r.map((t,n)=>{const s=e[n];return t.defaultedQueryOptions.notifyOnChangeProps?s:t.observer.trackResult(s,a=>{r.forEach(h=>{h.observer.trackProp(a)})})})},oe=function(e,r,t){if(r){const n=u(this,q),s=t!==void 0&&n!==void 0&&(n.length!==t.length||t.some((a,h)=>a!==n[h]));return(!u(this,F)||u(this,y)!==u(this,V)||s||r!==u(this,G))&&(x(this,G,r),x(this,V,u(this,y)),t!==void 0&&x(this,q,t),x(this,F,Be(u(this,F),r(e)))),u(this,F)}return e},me=function(){var e;return((e=u(this,I))==null?void 0:e.combine)!==void 0&&u(this,w).some((r,t)=>{var n;return r.options.suspense&&((n=u(this,y)[t])==null?void 0:n.data)===void 0})},re=function(e){const r=new Map;u(this,w).forEach(n=>{const s=n.options.queryHash;if(!s)return;const a=r.get(s);a?a.push(n):r.set(s,[n])});const t=[];return e.forEach(n=>{var b;const s=u(this,N).defaultQueryOptions(n),h=((b=r.get(s.queryHash))==null?void 0:b.shift())??new co(u(this,N),s);t.push({defaultedQueryOptions:s,observer:h})}),t},te=function(e,r){const t=u(this,w).indexOf(e);t!==-1&&(x(this,y,uo(u(this,y),t,r)),O(this,k,ne).call(this))},ne=function(){var e;if(this.hasListeners()){const r=O(this,k,ee).call(this,u(this,y),u(this,W)),t=O(this,k,me).call(this),n=u(this,F),s=t?n:O(this,k,oe).call(this,r,(e=u(this,I))==null?void 0:e.combine);(t||n!==s)&&ie.batch(()=>{this.listeners.forEach(a=>{a(u(this,y))})})}},ue);function wo({queries:o,...e},r){const t=lo(),n=j(()=>{const l=typeof o=="function"?o():o;return Ke(l).map(i=>{var m;const c=Le(i);typeof c.enabled=="function"&&(c.enabled=i.enabled());const f=t.defaultQueryOptions(c);return f._optimisticResults=(m=t.isRestoring)!=null&&m.value?"isRestoring":"optimistic",f})}),s=new ho(t,n.value,e),a=()=>{const[l,g]=s.getOptimisticResult(n.value,e.combine);return g(l.map((i,c)=>({...i,refetch:async(...f)=>{const[{[c]:m}]=s.getOptimisticResult(n.value,e.combine);return m.refetch(...f)}})))},h=_e(a());let b=()=>{};return t.isRestoring&&ce(t.isRestoring,l=>{l||(b(),b=s.subscribe(()=>{h.value=a()}),h.value=a())},{immediate:!0}),ce(n,l=>{s.setQueries(l,e),h.value=a()}),Ge(()=>{b()}),e.shallow?je(h):Ne(h)}const bo={sizeSmall:"14px",sizeMedium:"16px",sizeLarge:"18px",labelPadding:"0 8px",labelFontWeight:"400"};function fo(o){const{baseColor:e,inputColorDisabled:r,cardColor:t,modalColor:n,popoverColor:s,textColorDisabled:a,borderColor:h,primaryColor:b,textColor2:l,fontSizeSmall:g,fontSizeMedium:i,fontSizeLarge:c,borderRadiusSmall:f,lineHeight:m}=o;return Object.assign(Object.assign({},bo),{labelLineHeight:m,fontSizeSmall:g,fontSizeMedium:i,fontSizeLarge:c,borderRadius:f,color:e,colorChecked:b,colorDisabled:r,colorDisabledChecked:r,colorTableHeader:t,colorTableHeaderModal:n,colorTableHeaderPopover:s,checkMarkColor:e,checkMarkColorDisabled:a,checkMarkColorDisabledChecked:a,border:`1px solid ${h}`,borderDisabled:`1px solid ${h}`,borderDisabledChecked:`1px solid ${h}`,borderChecked:`1px solid ${b}`,borderFocus:`1px solid ${b}`,boxShadowFocus:`0 0 0 2px ${qe(b,{alpha:.3})}`,textColor:l,textColorDisabled:a})}const vo={common:Ve,self:fo},ge=We("n-checkbox-group"),ko={min:Number,max:Number,size:String,value:Array,defaultValue:{type:Array,default:null},disabled:{type:Boolean,default:void 0},"onUpdate:value":[Function,Array],onUpdateValue:[Function,Array],onChange:[Function,Array]},zo=he({name:"CheckboxGroup",props:ko,setup(o){const{mergedClsPrefixRef:e}=be(o),r=fe(o),{mergedSizeRef:t,mergedDisabledRef:n}=r,s=X(o.defaultValue),a=j(()=>o.value),h=ve(a,s),b=j(()=>{var i;return((i=h.value)===null||i===void 0?void 0:i.length)||0}),l=j(()=>Array.isArray(h.value)?new Set(h.value):new Set);function g(i,c){const{nTriggerFormInput:f,nTriggerFormChange:m}=r,{onChange:p,"onUpdate:value":$,onUpdateValue:Q}=o;if(Array.isArray(h.value)){const R=Array.from(h.value),L=R.findIndex(J=>J===c);i?~L||(R.push(c),Q&&C(Q,R,{actionType:"check",value:c}),$&&C($,R,{actionType:"check",value:c}),f(),m(),s.value=R,p&&C(p,R)):~L&&(R.splice(L,1),Q&&C(Q,R,{actionType:"uncheck",value:c}),$&&C($,R,{actionType:"uncheck",value:c}),p&&C(p,R),s.value=R,f(),m())}else i?(Q&&C(Q,[c],{actionType:"check",value:c}),$&&C($,[c],{actionType:"check",value:c}),p&&C(p,[c]),s.value=[c],f(),m()):(Q&&C(Q,[],{actionType:"uncheck",value:c}),$&&C($,[],{actionType:"uncheck",value:c}),p&&C(p,[]),s.value=[],f(),m())}return Je(ge,{checkedCountRef:b,maxRef:Z(o,"max"),minRef:Z(o,"min"),valueSetRef:l,disabledRef:n,mergedSizeRef:t,toggleCheckbox:g}),{mergedClsPrefix:e}},render(){return z("div",{class:`${this.mergedClsPrefix}-checkbox-group`,role:"group"},this.$slots)}}),mo=()=>z("svg",{viewBox:"0 0 64 64",class:"check-icon"},z("path",{d:"M50.42,16.76L22.34,39.45l-8.1-11.46c-1.12-1.58-3.3-1.96-4.88-0.84c-1.58,1.12-1.95,3.3-0.84,4.88l10.26,14.51  c0.56,0.79,1.42,1.31,2.38,1.45c0.16,0.02,0.32,0.03,0.48,0.03c0.8,0,1.57-0.27,2.2-0.78l30.99-25.03c1.5-1.21,1.74-3.42,0.52-4.92  C54.13,15.78,51.93,15.55,50.42,16.76z"})),go=()=>z("svg",{viewBox:"0 0 100 100",class:"line-icon"},z("path",{d:"M80.2,55.5H21.4c-2.8,0-5.1-2.5-5.1-5.5l0,0c0-3,2.3-5.5,5.1-5.5h58.7c2.8,0,5.1,2.5,5.1,5.5l0,0C85.2,53.1,82.9,55.5,80.2,55.5z"})),po=T([v("checkbox",`
 font-size: var(--n-font-size);
 outline: none;
 cursor: pointer;
 display: inline-flex;
 flex-wrap: nowrap;
 align-items: flex-start;
 word-break: break-word;
 line-height: var(--n-size);
 --n-merged-color-table: var(--n-color-table);
 `,[H("show-label","line-height: var(--n-label-line-height);"),T("&:hover",[v("checkbox-box",[A("border","border: var(--n-border-checked);")])]),T("&:focus:not(:active)",[v("checkbox-box",[A("border",`
 border: var(--n-border-focus);
 box-shadow: var(--n-box-shadow-focus);
 `)])]),H("inside-table",[v("checkbox-box",`
 background-color: var(--n-merged-color-table);
 `)]),H("checked",[v("checkbox-box",`
 background-color: var(--n-color-checked);
 `,[v("checkbox-icon",[T(".check-icon",`
 opacity: 1;
 transform: scale(1);
 `)])])]),H("indeterminate",[v("checkbox-box",[v("checkbox-icon",[T(".check-icon",`
 opacity: 0;
 transform: scale(.5);
 `),T(".line-icon",`
 opacity: 1;
 transform: scale(1);
 `)])])]),H("checked, indeterminate",[T("&:focus:not(:active)",[v("checkbox-box",[A("border",`
 border: var(--n-border-checked);
 box-shadow: var(--n-box-shadow-focus);
 `)])]),v("checkbox-box",`
 background-color: var(--n-color-checked);
 border-left: 0;
 border-top: 0;
 `,[A("border",{border:"var(--n-border-checked)"})])]),H("disabled",{cursor:"not-allowed"},[H("checked",[v("checkbox-box",`
 background-color: var(--n-color-disabled-checked);
 `,[A("border",{border:"var(--n-border-disabled-checked)"}),v("checkbox-icon",[T(".check-icon, .line-icon",{fill:"var(--n-check-mark-color-disabled-checked)"})])])]),v("checkbox-box",`
 background-color: var(--n-color-disabled);
 `,[A("border",`
 border: var(--n-border-disabled);
 `),v("checkbox-icon",[T(".check-icon, .line-icon",`
 fill: var(--n-check-mark-color-disabled);
 `)])]),A("label",`
 color: var(--n-text-color-disabled);
 `)]),v("checkbox-box-wrapper",`
 position: relative;
 width: var(--n-size);
 flex-shrink: 0;
 flex-grow: 0;
 user-select: none;
 -webkit-user-select: none;
 `),v("checkbox-box",`
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
 `,[A("border",`
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
 `),v("checkbox-icon",`
 display: flex;
 align-items: center;
 justify-content: center;
 position: absolute;
 left: 1px;
 right: 1px;
 top: 1px;
 bottom: 1px;
 `,[T(".check-icon, .line-icon",`
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
 `),Ye({left:"1px",top:"1px"})])]),A("label",`
 color: var(--n-text-color);
 transition: color .3s var(--n-bezier);
 user-select: none;
 -webkit-user-select: none;
 padding: var(--n-label-padding);
 font-weight: var(--n-label-font-weight);
 `,[T("&:empty",{display:"none"})])]),Xe(v("checkbox",`
 --n-merged-color-table: var(--n-color-table-modal);
 `)),Ze(v("checkbox",`
 --n-merged-color-table: var(--n-color-table-popover);
 `))]),xo=Object.assign(Object.assign({},ke.props),{size:String,checked:{type:[Boolean,String,Number],default:void 0},defaultChecked:{type:[Boolean,String,Number],default:!1},value:[String,Number],disabled:{type:Boolean,default:void 0},indeterminate:Boolean,label:String,focusable:{type:Boolean,default:!0},checkedValue:{type:[Boolean,String,Number],default:!0},uncheckedValue:{type:[Boolean,String,Number],default:!1},"onUpdate:checked":[Function,Array],onUpdateChecked:[Function,Array],privateInsideTable:Boolean,onChange:[Function,Array]}),So=he({name:"Checkbox",props:xo,setup(o){const e=io(ge,null),r=X(null),{mergedClsPrefixRef:t,inlineThemeDisabled:n,mergedRtlRef:s,mergedComponentPropsRef:a}=be(o),h=X(o.defaultChecked),b=Z(o,"checked"),l=ve(b,h),g=to(()=>{if(e){const d=e.valueSetRef.value;return d&&o.value!==void 0?d.has(o.value):!1}else return l.value===o.checkedValue}),i=fe(o,{mergedSize(d){var D,M;const{size:E}=o;if(E!==void 0)return E;if(e){const{value:U}=e.mergedSizeRef;if(U!==void 0)return U}if(d){const{mergedSize:U}=d;if(U!==void 0)return U.value}const P=(M=(D=a==null?void 0:a.value)===null||D===void 0?void 0:D.Checkbox)===null||M===void 0?void 0:M.size;return P||"medium"},mergedDisabled(d){const{disabled:D}=o;if(D!==void 0)return D;if(e){if(e.disabledRef.value)return!0;const{maxRef:{value:M},checkedCountRef:E}=e;if(M!==void 0&&E.value>=M&&!g.value)return!0;const{minRef:{value:P}}=e;if(P!==void 0&&E.value<=P&&g.value)return!0}return d?d.disabled.value:!1}}),{mergedDisabledRef:c,mergedSizeRef:f}=i,m=ke("Checkbox","-checkbox",po,vo,o,t);function p(d){if(e&&o.value!==void 0)e.toggleCheckbox(!g.value,o.value);else{const{onChange:D,"onUpdate:checked":M,onUpdateChecked:E}=o,{nTriggerFormInput:P,nTriggerFormChange:U}=i,_=g.value?o.uncheckedValue:o.checkedValue;M&&C(M,_,d),E&&C(E,_,d),D&&C(D,_,d),P(),U(),h.value=_}}function $(d){c.value||p(d)}function Q(d){if(!c.value)switch(d.key){case" ":case"Enter":p(d)}}function R(d){switch(d.key){case" ":d.preventDefault()}}const L={focus:()=>{var d;(d=r.value)===null||d===void 0||d.focus()},blur:()=>{var d;(d=r.value)===null||d===void 0||d.blur()}},J=no("Checkbox",s,t),se=j(()=>{const{value:d}=f,{common:{cubicBezierEaseInOut:D},self:{borderRadius:M,color:E,colorChecked:P,colorDisabled:U,colorTableHeader:_,colorTableHeaderModal:pe,colorTableHeaderPopover:xe,checkMarkColor:Ce,checkMarkColorDisabled:ye,border:Re,borderFocus:we,borderDisabled:ze,borderChecked:Se,boxShadowFocus:Oe,textColor:De,textColorDisabled:Me,checkMarkColorDisabledChecked:Te,colorDisabledChecked:$e,borderDisabledChecked:Qe,labelPadding:Ee,labelLineHeight:Pe,labelFontWeight:Ue,[le("fontSize",d)]:Ae,[le("size",d)]:Fe}}=m.value;return{"--n-label-line-height":Pe,"--n-label-font-weight":Ue,"--n-size":Fe,"--n-bezier":D,"--n-border-radius":M,"--n-border":Re,"--n-border-checked":Se,"--n-border-focus":we,"--n-border-disabled":ze,"--n-border-disabled-checked":Qe,"--n-box-shadow-focus":Oe,"--n-color":E,"--n-color-checked":P,"--n-color-table":_,"--n-color-table-modal":pe,"--n-color-table-popover":xe,"--n-color-disabled":U,"--n-color-disabled-checked":$e,"--n-text-color":De,"--n-text-color-disabled":Me,"--n-check-mark-color":Ce,"--n-check-mark-color-disabled":ye,"--n-check-mark-color-disabled-checked":Te,"--n-font-size":Ae,"--n-label-padding":Ee}}),B=n?so("checkbox",j(()=>f.value[0]),se,o):void 0;return Object.assign(i,L,{rtlEnabled:J,selfRef:r,mergedClsPrefix:t,mergedDisabled:c,renderedChecked:g,mergedTheme:m,labelId:ao(),handleClick:$,handleKeyUp:Q,handleKeyDown:R,cssVars:n?void 0:se,themeClass:B==null?void 0:B.themeClass,onRender:B==null?void 0:B.onRender})},render(){var o;const{$slots:e,renderedChecked:r,mergedDisabled:t,indeterminate:n,privateInsideTable:s,cssVars:a,labelId:h,label:b,mergedClsPrefix:l,focusable:g,handleKeyUp:i,handleKeyDown:c,handleClick:f}=this;(o=this.onRender)===null||o===void 0||o.call(this);const m=eo(e.default,p=>b||p?z("span",{class:`${l}-checkbox__label`,id:h},b||p):null);return z("div",{ref:"selfRef",class:[`${l}-checkbox`,this.themeClass,this.rtlEnabled&&`${l}-checkbox--rtl`,r&&`${l}-checkbox--checked`,t&&`${l}-checkbox--disabled`,n&&`${l}-checkbox--indeterminate`,s&&`${l}-checkbox--inside-table`,m&&`${l}-checkbox--show-label`],tabindex:t||!g?void 0:0,role:"checkbox","aria-checked":n?"mixed":r,"aria-labelledby":h,style:a,onKeyup:i,onKeydown:c,onClick:f,onMousedown:()=>{ro("selectstart",window,p=>{p.preventDefault()},{once:!0})}},z("div",{class:`${l}-checkbox-box-wrapper`}," ",z("div",{class:`${l}-checkbox-box`},z(oo,null,{default:()=>this.indeterminate?z("div",{key:"indeterminate",class:`${l}-checkbox-icon`},go()):z("div",{key:"check",class:`${l}-checkbox-icon`},mo())}),z("div",{class:`${l}-checkbox-box__border`}))),m)}});export{zo as N,So as a,wo as u};

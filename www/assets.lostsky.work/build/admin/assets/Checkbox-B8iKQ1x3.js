var ae=o=>{throw TypeError(o)};var Y=(o,e,r)=>e.has(o)||ae("Cannot "+r);var u=(o,e,r)=>(Y(o,e,"read from private field"),r?r.call(o):e.get(o)),S=(o,e,r)=>e.has(o)?ae("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(o):e.set(o,r),x=(o,e,r,t)=>(Y(o,e,"write to private field"),t?t.call(o,r):e.set(o,r),r),O=(o,e,r)=>(Y(o,e,"access private method"),r);import{a0 as Ue,a1 as ie,a2 as Ie,a3 as Be,a4 as _e,p as ce,a5 as je,a6 as Le,h as j,u as Ne,a7 as Ke,a8 as Ve,A as Ge,a9 as qe,d as he,v as z,G as be,J as fe,l as X,K as ve,aa as We,ab as Je,V as Z,Q as C,C as M,D as v,ac as U,ad as F,ae as Ye,af as Xe,ag as Ze,E as eo,ah as oo,T as ro,L as to,H as ke,M as no,ai as so,aj as ao,ak as io,al as le}from"./index-zQZQ3wrk.js";import{Q as co,u as lo}from"./RetryState.vue_vue_type_script_setup_true_lang-BEeS3nYw.js";function de(o,e){const r=new Set(e);return o.filter(t=>!r.has(t))}function uo(o,e,r){const t=o.slice(0);return t[e]=r,t}var L,y,N,I,w,H,V,G,q,W,k,ee,oe,me,re,te,ne,ue,ho=(ue=class extends Ue{constructor(e,r,t){super();S(this,k);S(this,L);S(this,y);S(this,N);S(this,I);S(this,w);S(this,H);S(this,V);S(this,G);S(this,q);S(this,W,[]);x(this,L,e),x(this,I,t),x(this,N,[]),x(this,w,[]),x(this,y,[]),this.setQueries(r)}onSubscribe(){this.listeners.size===1&&u(this,w).forEach(e=>{e.subscribe(r=>{O(this,k,te).call(this,e,r)})})}onUnsubscribe(){this.listeners.size||this.destroy()}destroy(){this.listeners=new Set,u(this,w).forEach(e=>{e.destroy()})}setQueries(e,r){x(this,N,e),x(this,I,r),ie.batch(()=>{const t=u(this,w),n=O(this,k,re).call(this,u(this,N));n.forEach(i=>i.observer.setOptions(i.defaultedQueryOptions));const s=n.map(i=>i.observer),a=s.map(i=>i.getCurrentResult()),h=t.length!==s.length,b=s.some((i,c)=>i!==t[c]),l=h||b,g=l?!0:a.some((i,c)=>{const f=u(this,y)[c];return!f||!Ie(i,f)});!l&&!g||(l&&(x(this,W,n),x(this,w,s)),x(this,y,a),this.hasListeners()&&(l&&(de(t,s).forEach(i=>{i.destroy()}),de(s,t).forEach(i=>{i.subscribe(c=>{O(this,k,te).call(this,i,c)})})),O(this,k,ne).call(this)))})}getCurrentResult(){return u(this,y)}getQueries(){return u(this,w).map(e=>e.getCurrentQuery())}getObservers(){return u(this,w)}getOptimisticResult(e,r){const t=O(this,k,re).call(this,e),n=t.map(a=>a.observer.getOptimisticResult(a.defaultedQueryOptions)),s=t.map(a=>a.defaultedQueryOptions.queryHash);return[n,a=>O(this,k,oe).call(this,a??n,r,s),()=>O(this,k,ee).call(this,n,t)]}},L=new WeakMap,y=new WeakMap,N=new WeakMap,I=new WeakMap,w=new WeakMap,H=new WeakMap,V=new WeakMap,G=new WeakMap,q=new WeakMap,W=new WeakMap,k=new WeakSet,ee=function(e,r){return r.map((t,n)=>{const s=e[n];return t.defaultedQueryOptions.notifyOnChangeProps?s:t.observer.trackResult(s,a=>{r.forEach(h=>{h.observer.trackProp(a)})})})},oe=function(e,r,t){if(r){const n=u(this,q),s=t!==void 0&&n!==void 0&&(n.length!==t.length||t.some((a,h)=>a!==n[h]));return(!u(this,H)||u(this,y)!==u(this,G)||s||r!==u(this,V))&&(x(this,V,r),x(this,G,u(this,y)),t!==void 0&&x(this,q,t),x(this,H,Be(u(this,H),r(e)))),u(this,H)}return e},me=function(){var e;return((e=u(this,I))==null?void 0:e.combine)!==void 0&&u(this,w).some((r,t)=>{var n;return r.options.suspense&&((n=u(this,y)[t])==null?void 0:n.data)===void 0})},re=function(e){const r=new Map;u(this,w).forEach(n=>{const s=n.options.queryHash;if(!s)return;const a=r.get(s);a?a.push(n):r.set(s,[n])});const t=[];return e.forEach(n=>{var b;const s=u(this,L).defaultQueryOptions(n),h=((b=r.get(s.queryHash))==null?void 0:b.shift())??new co(u(this,L),s);t.push({defaultedQueryOptions:s,observer:h})}),t},te=function(e,r){const t=u(this,w).indexOf(e);t!==-1&&(x(this,y,uo(u(this,y),t,r)),O(this,k,ne).call(this))},ne=function(){var e;if(this.hasListeners()){const r=O(this,k,ee).call(this,u(this,y),u(this,W)),t=O(this,k,me).call(this),n=u(this,H),s=t?n:O(this,k,oe).call(this,r,(e=u(this,I))==null?void 0:e.combine);(t||n!==s)&&ie.batch(()=>{this.listeners.forEach(a=>{a(u(this,y))})})}},ue);function wo({queries:o,...e},r){const t=lo(),n=j(()=>{const l=typeof o=="function"?o():o;return Ne(l).map(i=>{var m;const c=Ke(i);typeof c.enabled=="function"&&(c.enabled=i.enabled());const f=t.defaultQueryOptions(c);return f._optimisticResults=(m=t.isRestoring)!=null&&m.value?"isRestoring":"optimistic",f})}),s=new ho(t,n.value,e),a=()=>{const[l,g]=s.getOptimisticResult(n.value,e.combine);return g(l.map((i,c)=>({...i,refetch:async(...f)=>{const[{[c]:m}]=s.getOptimisticResult(n.value,e.combine);return m.refetch(...f)}})))},h=_e(a());let b=()=>{};return t.isRestoring&&ce(t.isRestoring,l=>{l||(b(),b=s.subscribe(()=>{h.value=a()}),h.value=a())},{immediate:!0}),ce(n,l=>{s.setQueries(l,e),h.value=a()}),Ve(()=>{b()}),e.shallow?je(h):Le(h)}const bo={sizeSmall:"14px",sizeMedium:"16px",sizeLarge:"18px",labelPadding:"0 8px",labelFontWeight:"400"};function fo(o){const{baseColor:e,inputColorDisabled:r,cardColor:t,modalColor:n,popoverColor:s,textColorDisabled:a,borderColor:h,primaryColor:b,textColor2:l,fontSizeSmall:g,fontSizeMedium:i,fontSizeLarge:c,borderRadiusSmall:f,lineHeight:m}=o;return Object.assign(Object.assign({},bo),{labelLineHeight:m,fontSizeSmall:g,fontSizeMedium:i,fontSizeLarge:c,borderRadius:f,color:e,colorChecked:b,colorDisabled:r,colorDisabledChecked:r,colorTableHeader:t,colorTableHeaderModal:n,colorTableHeaderPopover:s,checkMarkColor:e,checkMarkColorDisabled:a,checkMarkColorDisabledChecked:a,border:`1px solid ${h}`,borderDisabled:`1px solid ${h}`,borderDisabledChecked:`1px solid ${h}`,borderChecked:`1px solid ${b}`,borderFocus:`1px solid ${b}`,boxShadowFocus:`0 0 0 2px ${qe(b,{alpha:.3})}`,textColor:l,textColorDisabled:a})}const vo={common:Ge,self:fo},ge=We("n-checkbox-group"),ko={min:Number,max:Number,size:String,value:Array,defaultValue:{type:Array,default:null},disabled:{type:Boolean,default:void 0},"onUpdate:value":[Function,Array],onUpdateValue:[Function,Array],onChange:[Function,Array]},zo=he({name:"CheckboxGroup",props:ko,setup(o){const{mergedClsPrefixRef:e}=be(o),r=fe(o),{mergedSizeRef:t,mergedDisabledRef:n}=r,s=X(o.defaultValue),a=j(()=>o.value),h=ve(a,s),b=j(()=>{var i;return((i=h.value)===null||i===void 0?void 0:i.length)||0}),l=j(()=>Array.isArray(h.value)?new Set(h.value):new Set);function g(i,c){const{nTriggerFormInput:f,nTriggerFormChange:m}=r,{onChange:p,"onUpdate:value":$,onUpdateValue:Q}=o;if(Array.isArray(h.value)){const R=Array.from(h.value),K=R.findIndex(J=>J===c);i?~K||(R.push(c),Q&&C(Q,R,{actionType:"check",value:c}),$&&C($,R,{actionType:"check",value:c}),f(),m(),s.value=R,p&&C(p,R)):~K&&(R.splice(K,1),Q&&C(Q,R,{actionType:"uncheck",value:c}),$&&C($,R,{actionType:"uncheck",value:c}),p&&C(p,R),s.value=R,f(),m())}else i?(Q&&C(Q,[c],{actionType:"check",value:c}),$&&C($,[c],{actionType:"check",value:c}),p&&C(p,[c]),s.value=[c],f(),m()):(Q&&C(Q,[],{actionType:"uncheck",value:c}),$&&C($,[],{actionType:"uncheck",value:c}),p&&C(p,[]),s.value=[],f(),m())}return Je(ge,{checkedCountRef:b,maxRef:Z(o,"max"),minRef:Z(o,"min"),valueSetRef:l,disabledRef:n,mergedSizeRef:t,toggleCheckbox:g}),{mergedClsPrefix:e}},render(){return z("div",{class:`${this.mergedClsPrefix}-checkbox-group`,role:"group"},this.$slots)}}),mo=()=>z("svg",{viewBox:"0 0 64 64",class:"check-icon"},z("path",{d:"M50.42,16.76L22.34,39.45l-8.1-11.46c-1.12-1.58-3.3-1.96-4.88-0.84c-1.58,1.12-1.95,3.3-0.84,4.88l10.26,14.51  c0.56,0.79,1.42,1.31,2.38,1.45c0.16,0.02,0.32,0.03,0.48,0.03c0.8,0,1.57-0.27,2.2-0.78l30.99-25.03c1.5-1.21,1.74-3.42,0.52-4.92  C54.13,15.78,51.93,15.55,50.42,16.76z"})),go=()=>z("svg",{viewBox:"0 0 100 100",class:"line-icon"},z("path",{d:"M80.2,55.5H21.4c-2.8,0-5.1-2.5-5.1-5.5l0,0c0-3,2.3-5.5,5.1-5.5h58.7c2.8,0,5.1,2.5,5.1,5.5l0,0C85.2,53.1,82.9,55.5,80.2,55.5z"})),po=M([v("checkbox",`
 font-size: var(--n-font-size);
 outline: none;
 cursor: pointer;
 display: inline-flex;
 flex-wrap: nowrap;
 align-items: flex-start;
 word-break: break-word;
 line-height: var(--n-size);
 --n-merged-color-table: var(--n-color-table);
 `,[U("show-label","line-height: var(--n-label-line-height);"),M("&:hover",[v("checkbox-box",[F("border","border: var(--n-border-checked);")])]),M("&:focus:not(:active)",[v("checkbox-box",[F("border",`
 border: var(--n-border-focus);
 box-shadow: var(--n-box-shadow-focus);
 `)])]),U("inside-table",[v("checkbox-box",`
 background-color: var(--n-merged-color-table);
 `)]),U("checked",[v("checkbox-box",`
 background-color: var(--n-color-checked);
 `,[v("checkbox-icon",[M(".check-icon",`
 opacity: 1;
 transform: scale(1);
 `)])])]),U("indeterminate",[v("checkbox-box",[v("checkbox-icon",[M(".check-icon",`
 opacity: 0;
 transform: scale(.5);
 `),M(".line-icon",`
 opacity: 1;
 transform: scale(1);
 `)])])]),U("checked, indeterminate",[M("&:focus:not(:active)",[v("checkbox-box",[F("border",`
 border: var(--n-border-checked);
 box-shadow: var(--n-box-shadow-focus);
 `)])]),v("checkbox-box",`
 background-color: var(--n-color-checked);
 border-left: 0;
 border-top: 0;
 `,[F("border",{border:"var(--n-border-checked)"})])]),U("disabled",{cursor:"not-allowed"},[U("checked",[v("checkbox-box",`
 background-color: var(--n-color-disabled-checked);
 `,[F("border",{border:"var(--n-border-disabled-checked)"}),v("checkbox-icon",[M(".check-icon, .line-icon",{fill:"var(--n-check-mark-color-disabled-checked)"})])])]),v("checkbox-box",`
 background-color: var(--n-color-disabled);
 `,[F("border",`
 border: var(--n-border-disabled);
 `),v("checkbox-icon",[M(".check-icon, .line-icon",`
 fill: var(--n-check-mark-color-disabled);
 `)])]),F("label",`
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
 `,[F("border",`
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
 `,[M(".check-icon, .line-icon",`
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
 `),Ye({left:"1px",top:"1px"})])]),F("label",`
 color: var(--n-text-color);
 transition: color .3s var(--n-bezier);
 user-select: none;
 -webkit-user-select: none;
 padding: var(--n-label-padding);
 font-weight: var(--n-label-font-weight);
 `,[M("&:empty",{display:"none"})])]),Xe(v("checkbox",`
 --n-merged-color-table: var(--n-color-table-modal);
 `)),Ze(v("checkbox",`
 --n-merged-color-table: var(--n-color-table-popover);
 `))]),xo=Object.assign(Object.assign({},ke.props),{size:String,checked:{type:[Boolean,String,Number],default:void 0},defaultChecked:{type:[Boolean,String,Number],default:!1},value:[String,Number],disabled:{type:Boolean,default:void 0},indeterminate:Boolean,label:String,focusable:{type:Boolean,default:!0},checkedValue:{type:[Boolean,String,Number],default:!0},uncheckedValue:{type:[Boolean,String,Number],default:!1},"onUpdate:checked":[Function,Array],onUpdateChecked:[Function,Array],privateInsideTable:Boolean,onChange:[Function,Array]}),So=he({name:"Checkbox",props:xo,setup(o){const e=io(ge,null),r=X(null),{mergedClsPrefixRef:t,inlineThemeDisabled:n,mergedRtlRef:s,mergedComponentPropsRef:a}=be(o),h=X(o.defaultChecked),b=Z(o,"checked"),l=ve(b,h),g=to(()=>{if(e){const d=e.valueSetRef.value;return d&&o.value!==void 0?d.has(o.value):!1}else return l.value===o.checkedValue}),i=fe(o,{mergedSize(d){var D,T;const{size:E}=o;if(E!==void 0)return E;if(e){const{value:A}=e.mergedSizeRef;if(A!==void 0)return A}if(d){const{mergedSize:A}=d;if(A!==void 0)return A.value}const P=(T=(D=a==null?void 0:a.value)===null||D===void 0?void 0:D.Checkbox)===null||T===void 0?void 0:T.size;return P||"medium"},mergedDisabled(d){const{disabled:D}=o;if(D!==void 0)return D;if(e){if(e.disabledRef.value)return!0;const{maxRef:{value:T},checkedCountRef:E}=e;if(T!==void 0&&E.value>=T&&!g.value)return!0;const{minRef:{value:P}}=e;if(P!==void 0&&E.value<=P&&g.value)return!0}return d?d.disabled.value:!1}}),{mergedDisabledRef:c,mergedSizeRef:f}=i,m=ke("Checkbox","-checkbox",po,vo,o,t);function p(d){if(e&&o.value!==void 0)e.toggleCheckbox(!g.value,o.value);else{const{onChange:D,"onUpdate:checked":T,onUpdateChecked:E}=o,{nTriggerFormInput:P,nTriggerFormChange:A}=i,_=g.value?o.uncheckedValue:o.checkedValue;T&&C(T,_,d),E&&C(E,_,d),D&&C(D,_,d),P(),A(),h.value=_}}function $(d){c.value||p(d)}function Q(d){if(!c.value)switch(d.key){case" ":case"Enter":p(d)}}function R(d){switch(d.key){case" ":d.preventDefault()}}const K={focus:()=>{var d;(d=r.value)===null||d===void 0||d.focus()},blur:()=>{var d;(d=r.value)===null||d===void 0||d.blur()}},J=no("Checkbox",s,t),se=j(()=>{const{value:d}=f,{common:{cubicBezierEaseInOut:D},self:{borderRadius:T,color:E,colorChecked:P,colorDisabled:A,colorTableHeader:_,colorTableHeaderModal:pe,colorTableHeaderPopover:xe,checkMarkColor:Ce,checkMarkColorDisabled:ye,border:Re,borderFocus:we,borderDisabled:ze,borderChecked:Se,boxShadowFocus:Oe,textColor:De,textColorDisabled:Te,checkMarkColorDisabledChecked:Me,colorDisabledChecked:$e,borderDisabledChecked:Qe,labelPadding:Ee,labelLineHeight:Pe,labelFontWeight:Ae,[le("fontSize",d)]:Fe,[le("size",d)]:He}}=m.value;return{"--n-label-line-height":Pe,"--n-label-font-weight":Ae,"--n-size":He,"--n-bezier":D,"--n-border-radius":T,"--n-border":Re,"--n-border-checked":Se,"--n-border-focus":we,"--n-border-disabled":ze,"--n-border-disabled-checked":Qe,"--n-box-shadow-focus":Oe,"--n-color":E,"--n-color-checked":P,"--n-color-table":_,"--n-color-table-modal":pe,"--n-color-table-popover":xe,"--n-color-disabled":A,"--n-color-disabled-checked":$e,"--n-text-color":De,"--n-text-color-disabled":Te,"--n-check-mark-color":Ce,"--n-check-mark-color-disabled":ye,"--n-check-mark-color-disabled-checked":Me,"--n-font-size":Fe,"--n-label-padding":Ee}}),B=n?so("checkbox",j(()=>f.value[0]),se,o):void 0;return Object.assign(i,K,{rtlEnabled:J,selfRef:r,mergedClsPrefix:t,mergedDisabled:c,renderedChecked:g,mergedTheme:m,labelId:ao(),handleClick:$,handleKeyUp:Q,handleKeyDown:R,cssVars:n?void 0:se,themeClass:B==null?void 0:B.themeClass,onRender:B==null?void 0:B.onRender})},render(){var o;const{$slots:e,renderedChecked:r,mergedDisabled:t,indeterminate:n,privateInsideTable:s,cssVars:a,labelId:h,label:b,mergedClsPrefix:l,focusable:g,handleKeyUp:i,handleKeyDown:c,handleClick:f}=this;(o=this.onRender)===null||o===void 0||o.call(this);const m=eo(e.default,p=>b||p?z("span",{class:`${l}-checkbox__label`,id:h},b||p):null);return z("div",{ref:"selfRef",class:[`${l}-checkbox`,this.themeClass,this.rtlEnabled&&`${l}-checkbox--rtl`,r&&`${l}-checkbox--checked`,t&&`${l}-checkbox--disabled`,n&&`${l}-checkbox--indeterminate`,s&&`${l}-checkbox--inside-table`,m&&`${l}-checkbox--show-label`],tabindex:t||!g?void 0:0,role:"checkbox","aria-checked":n?"mixed":r,"aria-labelledby":h,style:a,onKeyup:i,onKeydown:c,onClick:f,onMousedown:()=>{ro("selectstart",window,p=>{p.preventDefault()},{once:!0})}},z("div",{class:`${l}-checkbox-box-wrapper`}," ",z("div",{class:`${l}-checkbox-box`},z(oo,null,{default:()=>this.indeterminate?z("div",{key:"indeterminate",class:`${l}-checkbox-icon`},go()):z("div",{key:"check",class:`${l}-checkbox-icon`},mo())}),z("div",{class:`${l}-checkbox-box__border`}))),m)}});export{zo as N,So as a,wo as u};

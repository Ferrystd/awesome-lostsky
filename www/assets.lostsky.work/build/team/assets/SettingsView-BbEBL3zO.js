import{at as N,au as g,aw as _,as as S,ax as J,d as j,Q as C,ah as X,aC as A,aA as Z,b7 as ee,aE as ae,k as U,aN as P,C as oe,u as re,L as se,a as p,f as D,e as i,t as d,y as F,h as y,F as R,j as E,K as le,N as ne,b as c,w as V,g as ie,a4 as I,o as s,i as B,G as te,n as L,_ as de}from"./index-DgcYrrlp.js";import{L as ce}from"./LsEmptyState-B6J662ij.js";import{L as ue}from"./LsButton-B1fdNDA8.js";import{u as be}from"./useMutation-DmNRpbZt.js";import{_ as pe}from"./AdminPageHeader.vue_vue_type_script_setup_true_lang-CbpxluSg.js";import{s as he,r as me,a as ve,N as _e}from"./RadioGroup-C2puNacx.js";import{N as fe}from"./Switch-6a5XfTip.js";import{N as ye}from"./Select-D2bYlTj-.js";import{N as ke}from"./InputNumber-CGNRVyhy.js";import{N as we}from"./Input-CSJLa_UK.js";import"./Empty-53WJMbc0.js";import"./arrow-left-BQnAvfZe.js";import"./Tag-BMQ5H09s.js";const xe=N("radio",`
 line-height: var(--n-label-line-height);
 outline: none;
 position: relative;
 user-select: none;
 -webkit-user-select: none;
 display: inline-flex;
 align-items: flex-start;
 flex-wrap: nowrap;
 font-size: var(--n-font-size);
 word-break: break-word;
`,[g("checked",[_("dot",`
 background-color: var(--n-color-active);
 `)]),_("dot-wrapper",`
 position: relative;
 flex-shrink: 0;
 flex-grow: 0;
 width: var(--n-radio-size);
 `),N("radio-input",`
 position: absolute;
 border: 0;
 width: 0;
 height: 0;
 opacity: 0;
 margin: 0;
 `),_("dot",`
 position: absolute;
 top: 50%;
 left: 0;
 transform: translateY(-50%);
 height: var(--n-radio-size);
 width: var(--n-radio-size);
 background: var(--n-color);
 box-shadow: var(--n-box-shadow);
 border-radius: 50%;
 transition:
 background-color .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier);
 `,[S("&::before",`
 content: "";
 opacity: 0;
 position: absolute;
 left: 4px;
 top: 4px;
 height: calc(100% - 8px);
 width: calc(100% - 8px);
 border-radius: 50%;
 transform: scale(.8);
 background: var(--n-dot-color-active);
 transition: 
 opacity .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 transform .3s var(--n-bezier);
 `),g("checked",{boxShadow:"var(--n-box-shadow-active)"},[S("&::before",`
 opacity: 1;
 transform: scale(1);
 `)])]),_("label",`
 color: var(--n-text-color);
 padding: var(--n-label-padding);
 font-weight: var(--n-label-font-weight);
 display: inline-block;
 transition: color .3s var(--n-bezier);
 `),J("disabled",`
 cursor: pointer;
 `,[S("&:hover",[_("dot",{boxShadow:"var(--n-box-shadow-hover)"})]),g("focus",[S("&:not(:active)",[_("dot",{boxShadow:"var(--n-box-shadow-focus)"})])])]),g("disabled",`
 cursor: not-allowed;
 `,[_("dot",{boxShadow:"var(--n-box-shadow-disabled)",backgroundColor:"var(--n-color-disabled)"},[S("&::before",{backgroundColor:"var(--n-dot-color-disabled)"}),g("checked",`
 opacity: 1;
 `)]),_("label",{color:"var(--n-text-color-disabled)"}),N("radio-input",`
 cursor: not-allowed;
 `)])]),ge=Object.assign(Object.assign({},A.props),ve),Se=j({name:"Radio",props:ge,setup(f){const l=he(f),t=A("Radio","-radio",xe,me,f,l.mergedClsPrefix),m=U(()=>{const{mergedSize:{value:x}}=l,{common:{cubicBezierEaseInOut:z},self:{boxShadow:b,boxShadowActive:o,boxShadowDisabled:r,boxShadowFocus:e,boxShadowHover:$,color:a,colorDisabled:n,colorActive:O,textColor:M,textColorDisabled:q,dotColorActive:K,dotColorDisabled:Q,labelPadding:T,labelLineHeight:H,labelFontWeight:G,[P("fontSize",x)]:W,[P("radioSize",x)]:Y}}=t.value;return{"--n-bezier":z,"--n-label-line-height":H,"--n-label-font-weight":G,"--n-box-shadow":b,"--n-box-shadow-active":o,"--n-box-shadow-disabled":r,"--n-box-shadow-focus":e,"--n-box-shadow-hover":$,"--n-color":a,"--n-color-active":O,"--n-color-disabled":n,"--n-dot-color-active":K,"--n-dot-color-disabled":Q,"--n-font-size":W,"--n-radio-size":Y,"--n-text-color":M,"--n-text-color-disabled":q,"--n-label-padding":T}}),{inlineThemeDisabled:h,mergedClsPrefixRef:w,mergedRtlRef:v}=Z(f),k=ee("Radio",v,w),u=h?ae("radio",U(()=>l.mergedSize.value[0]),m,f):void 0;return Object.assign(l,{rtlEnabled:k,cssVars:h?void 0:m,themeClass:u==null?void 0:u.themeClass,onRender:u==null?void 0:u.onRender})},render(){const{$slots:f,mergedClsPrefix:l,onRender:t,label:m}=this;return t==null||t(),C("label",{class:[`${l}-radio`,this.themeClass,this.rtlEnabled&&`${l}-radio--rtl`,this.mergedDisabled&&`${l}-radio--disabled`,this.renderSafeChecked&&`${l}-radio--checked`,this.focus&&`${l}-radio--focus`],style:this.cssVars},C("div",{class:`${l}-radio__dot-wrapper`}," ",C("div",{class:[`${l}-radio__dot`,this.renderSafeChecked&&`${l}-radio__dot--checked`]}),C("input",{ref:"inputRef",type:"radio",class:`${l}-radio-input`,value:this.value,name:this.mergedName,checked:this.renderSafeChecked,disabled:this.mergedDisabled,onChange:this.handleRadioInputChange,onFocus:this.handleRadioInputFocus,onBlur:this.handleRadioInputBlur})),X(f.default,h=>!h&&!m?null:C("div",{ref:"labelRef",class:`${l}-radio__label`},h||m)))}}),Ce={class:"settings-view"},$e={key:0,class:"feedback error",role:"alert"},ze={key:1,class:"loading-panel",role:"status"},Ne=["onSubmit"],Re={class:"panel-heading"},Ee={class:"setting-copy"},Ve=["id"],Be=["id"],Ue={class:"radio-options"},Pe={class:"radio-copy"},De={key:0},Fe={key:0,class:"feedback error",role:"alert"},Ie={key:1,class:"feedback success",role:"status"},Le=j({__name:"SettingsView",setup(f){const l=oe(),t=le({}),m=te(""),h=re({queryKey:["settings","schema"],queryFn:()=>L.get("/setting/schema")}),w=U(()=>{var o;return((o=h.data.value)==null?void 0:o.apps)??[]});se(w,o=>{Object.keys(t).forEach(r=>delete t[r]),o.forEach(r=>{t[r.app_name]=Object.fromEntries(r.settings.map(e=>[e.key,e.value]))})},{immediate:!0});const v=be({mutationFn:o=>L.post("/setting",{app_name:o.app_name,settings:{...t[o.app_name]}}),onMutate:()=>{m.value=""},onSuccess:async(o,r)=>{m.value=r.app_name,await l.invalidateQueries({queryKey:["settings","schema"]})}});function k(o,r){var e;return((e=t[o])==null?void 0:e[r.key])??r.default}function u(o,r,e){e!==null&&t[o]&&(t[o][r]=e)}function x(o,r){const e=k(o,r);return typeof e=="boolean"?String(Number(e)):e}function z(o){var r;return v.isPending.value&&((r=v.variables.value)==null?void 0:r.app_name)===o}function b(o,r){return`setting-${o}-${r}`}return(o,r)=>(s(),p("div",Ce,[D(pe,{title:"团队设置",description:"配置团队级行为。设置项、输入类型和可选值均由服务端统一定义。"}),i(h).isError.value?(s(),p("p",$e,d(i(F)(i(h).error.value)),1)):i(h).isPending.value?(s(),p("div",ze,"正在加载团队设置…")):w.value.length?(s(!0),p(R,{key:3},E(w.value,e=>{var $;return s(),p("form",{key:e.app_name,class:"settings-panel",onSubmit:ne(a=>i(v).mutate(e),["prevent"])},[c("header",Re,[c("div",null,[c("p",null,d(e.app_name.toUpperCase()),1),c("h2",null,d(e.label),1),c("span",null,d(e.description),1)]),D(ue,{type:"submit",loading:z(e.app_name),disabled:i(v).isPending.value},{default:V(()=>[ie(" 保存"+d(e.label)+"设置 ",1)]),_:2},1032,["loading","disabled"])]),(s(!0),p(R,null,E(e.settings,a=>(s(),p("section",{key:a.key,class:I(["setting-row",{"setting-row--choices":a.control==="radio"}])},[c("div",Ee,[c("h3",{id:`${b(e.app_name,a.key)}-label`},d(a.label),9,Ve),c("p",{id:`${b(e.app_name,a.key)}-description`},d(a.description),9,Be),c("code",null,d(e.app_name)+"."+d(a.key),1)]),c("div",{class:I(["setting-control",{"setting-control--choices":a.control==="radio"}])},[a.control==="switch"?(s(),y(i(fe),{key:0,value:!!k(e.app_name,a),"aria-labelledby":`${b(e.app_name,a.key)}-label`,"aria-describedby":`${b(e.app_name,a.key)}-description`,"onUpdate:value":n=>u(e.app_name,a.key,n)},null,8,["value","aria-labelledby","aria-describedby","onUpdate:value"])):a.control==="radio"?(s(),y(i(_e),{key:1,value:x(e.app_name,a),"aria-labelledby":`${b(e.app_name,a.key)}-label`,"aria-describedby":`${b(e.app_name,a.key)}-description`,"onUpdate:value":n=>u(e.app_name,a.key,n)},{default:V(()=>[c("div",Ue,[(s(!0),p(R,null,E(a.options??[],n=>(s(),y(i(Se),{key:String(n.value),value:n.value},{default:V(()=>[c("span",Pe,[c("strong",null,d(n.label),1),n.description?(s(),p("small",De,d(n.description),1)):B("",!0)])]),_:2},1032,["value"]))),128))])]),_:2},1032,["value","aria-labelledby","aria-describedby","onUpdate:value"])):a.control==="select"?(s(),y(i(ye),{key:2,value:x(e.app_name,a),options:a.options??[],"aria-label":a.label,"aria-describedby":`${b(e.app_name,a.key)}-description`,"onUpdate:value":n=>u(e.app_name,a.key,n)},null,8,["value","options","aria-label","aria-describedby","onUpdate:value"])):a.control==="number"?(s(),y(i(ke),{key:3,value:Number(k(e.app_name,a)),min:a.min,max:a.max,step:a.step,"input-props":{"aria-label":a.label,"aria-describedby":`${b(e.app_name,a.key)}-description`},"onUpdate:value":n=>u(e.app_name,a.key,n)},null,8,["value","min","max","step","input-props","onUpdate:value"])):(s(),y(i(we),{key:4,value:String(k(e.app_name,a)),maxlength:a.max_length,"input-props":{"aria-label":a.label,"aria-describedby":`${b(e.app_name,a.key)}-description`},"onUpdate:value":n=>u(e.app_name,a.key,n)},null,8,["value","maxlength","input-props","onUpdate:value"]))],2)],2))),128)),i(v).isError.value&&(($=i(v).variables.value)==null?void 0:$.app_name)===e.app_name?(s(),p("p",Fe,d(i(F)(i(v).error.value)),1)):B("",!0),m.value===e.app_name?(s(),p("p",Ie,d(e.label)+"设置已保存。 ",1)):B("",!0)],40,Ne)}),128)):(s(),y(ce,{key:2,title:"当前没有可配置项",description:"应用登记团队设置后会自动显示在这里。"}))]))}}),Xe=de(Le,[["__scopeId","data-v-10ac5330"]]);export{Xe as default};

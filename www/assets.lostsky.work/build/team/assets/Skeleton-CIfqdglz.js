import{i as D,d as N,c as f,b as B,u as R,m as w,s as A,D as v}from"./browser-LtPhahJk.js";import{r as H}from"./index-BJKaMiZy.js";import{g as q,X as b,$ as E,F as I,d as k}from"./index-BvpFVGT5.js";let P=!1;function O(){if(D&&window.CSS&&!P&&(P=!0,"registerProperty"in(window==null?void 0:window.CSS)))try{CSS.registerProperty({name:"--n-color-start",syntax:"<color>",inherits:!1,initialValue:"#0000"}),CSS.registerProperty({name:"--n-color-end",syntax:"<color>",inherits:!1,initialValue:"#0000"})}catch{}}const Z={name:"zh-CN",global:{undo:"撤销",redo:"重做",confirm:"确认",clear:"清除"},Popconfirm:{positiveText:"确认",negativeText:"取消"},Cascader:{placeholder:"请选择",loading:"加载中",loadingRequiredMessage:e=>`加载全部 ${e} 的子节点后才可选中`},Time:{dateFormat:"yyyy-MM-dd",dateTimeFormat:"yyyy-MM-dd HH:mm:ss"},DatePicker:{yearFormat:"yyyy年",monthFormat:"MMM",dayFormat:"eeeeee",yearTypeFormat:"yyyy",monthTypeFormat:"yyyy-MM",dateFormat:"yyyy-MM-dd",dateTimeFormat:"yyyy-MM-dd HH:mm:ss",quarterFormat:"yyyy-qqq",weekFormat:"YYYY-w周",clear:"清除",now:"此刻",confirm:"确认",selectTime:"选择时间",selectDate:"选择日期",datePlaceholder:"选择日期",datetimePlaceholder:"选择日期时间",monthPlaceholder:"选择月份",yearPlaceholder:"选择年份",quarterPlaceholder:"选择季度",weekPlaceholder:"选择周",startDatePlaceholder:"开始日期",endDatePlaceholder:"结束日期",startDatetimePlaceholder:"开始日期时间",endDatetimePlaceholder:"结束日期时间",startMonthPlaceholder:"开始月份",endMonthPlaceholder:"结束月份",monthBeforeYear:!1,firstDayOfWeek:0,today:"今天"},DataTable:{checkTableAll:"选择全部表格数据",uncheckTableAll:"取消选择全部表格数据",confirm:"确认",clear:"重置"},LegacyTransfer:{sourceTitle:"源项",targetTitle:"目标项"},Transfer:{selectAll:"全选",clearAll:"清除",unselectAll:"取消全选",total:e=>`共 ${e} 项`,selected:e=>`已选 ${e} 项`},Empty:{description:"无数据"},Select:{placeholder:"请选择"},TimePicker:{placeholder:"请选择时间",positiveText:"确认",negativeText:"取消",now:"此刻",clear:"清除"},Pagination:{goto:"跳至",selectionSuffix:"页"},DynamicTags:{add:"添加"},Log:{loading:"加载中"},Input:{placeholder:"请输入"},InputNumber:{placeholder:"请输入"},DynamicInput:{create:"添加"},ThemeEditor:{title:"主题编辑器",clearAllVars:"清除全部变量",clearSearch:"清除搜索",filterCompName:"过滤组件名",filterVarName:"过滤变量名",import:"导入",export:"导出",restore:"恢复默认"},Image:{tipPrevious:"上一张（←）",tipNext:"下一张（→）",tipCounterclockwise:"向左旋转",tipClockwise:"向右旋转",tipZoomOut:"缩小",tipZoomIn:"放大",tipDownload:"下载",tipClose:"关闭（Esc）",tipOriginalSize:"缩放到原始尺寸"},Heatmap:{less:"少",more:"多",monthFormat:"MMM",weekdayFormat:"eeeeee"}};function _(e){const{heightSmall:n,heightMedium:r,heightLarge:l,borderRadius:i}=e;return{color:"#eee",colorEnd:"#ddd",borderRadius:i,heightSmall:n,heightMedium:r,heightLarge:l}}const $={common:N,self:_},V=f([B("skeleton",`
 height: 1em;
 width: 100%;
 transition:
 --n-color-start .3s var(--n-bezier),
 --n-color-end .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 animation: 2s skeleton-loading infinite cubic-bezier(0.36, 0, 0.64, 1);
 background-color: var(--n-color-start);
 `),f("@keyframes skeleton-loading",`
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
 `)]),Y=Object.assign(Object.assign({},w.props),{text:Boolean,round:Boolean,circle:Boolean,height:[String,Number],width:[String,Number],size:String,repeat:{type:Number,default:1},animated:{type:Boolean,default:!0},sharp:{type:Boolean,default:!0}}),K=q({name:"Skeleton",inheritAttrs:!1,props:Y,setup(e){O();const{mergedClsPrefixRef:n,mergedComponentPropsRef:r}=R(e),l=k(()=>{var t,o;return e.size||((o=(t=r==null?void 0:r.value)===null||t===void 0?void 0:t.Skeleton)===null||o===void 0?void 0:o.size)}),i=w("Skeleton","-skeleton",V,$,e,n);return{mergedClsPrefix:n,style:k(()=>{var t,o;const h=i.value,{common:{cubicBezierEaseInOut:S}}=h,y=h.self,{color:T,colorEnd:M,borderRadius:x}=y;let s;const{circle:d,sharp:C,round:z,width:a,height:c,text:g,animated:F}=e,p=l.value;p!==void 0&&(s=y[A("height",p)]);const m=d?(t=a??c)!==null&&t!==void 0?t:s:a,u=(o=d?a??c:c)!==null&&o!==void 0?o:s;return{display:g?"inline-block":"",verticalAlign:g?"-0.125em":"",borderRadius:d?"50%":z?"4096px":C?"":x,width:typeof m=="number"?v(m):m,height:typeof u=="number"?v(u):u,animation:F?"":"none","--n-bezier":S,"--n-color-start":T,"--n-color-end":M}})}},render(){const{repeat:e,style:n,mergedClsPrefix:r,$attrs:l}=this,i=b("div",E({class:`${r}-skeleton`,style:n},l));return e>1?b(I,null,H(e,null).map(t=>[i,`
`])):i}});export{K as N,Z as z};

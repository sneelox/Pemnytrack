import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

const KEY = 'pennytrack.transactions.v1';
const CATEGORIES = ['Food','Transport','Shopping','Bills','Education','Health','Home','Entertainment','Salary','Business','Other'];
const ICONS = {Food:'🍔',Transport:'🚌',Shopping:'🛍️',Bills:'🧾',Education:'📚',Health:'💊',Home:'🏠',Entertainment:'🎮',Salary:'💵',Business:'🏪',Other:'📌'};
const money = n => '₹' + Number(n || 0).toLocaleString('en-IN',{maximumFractionDigits:2});
const dateNow = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const monthNow = () => dateNow().slice(0,7);

export default function App() {
 const [records,setRecords]=useState([]);
 const [loaded,setLoaded]=useState(false);
 const [tab,setTab]=useState('Home');
 const [kind,setKind]=useState('expense');
 const [title,setTitle]=useState('');
 const [amount,setAmount]=useState('');
 const [category,setCategory]=useState('Food');
 const [date,setDate]=useState(dateNow());
 const [note,setNote]=useState('');
 const [budget,setBudget]=useState('10000');
 const [budgetEdit,setBudgetEdit]=useState('10000');
 const [filter,setFilter]=useState('all');
 const [query,setQuery]=useState('');

 useEffect(()=>{(async()=>{try{const raw=await AsyncStorage.getItem(KEY);if(raw){const data=JSON.parse(raw);setRecords(data.records||[]);setBudget(String(data.budget??10000));setBudgetEdit(String(data.budget??10000));}}catch(e){Alert.alert('Storage issue','Could not load saved records.');}finally{setLoaded(true);}})();},[]);
 useEffect(()=>{if(loaded) AsyncStorage.setItem(KEY,JSON.stringify({records,budget:Number(budget)||0})).catch(()=>Alert.alert('Save failed','Please restart the app and try again.'));},[records,budget,loaded]);

 const monthRecords=useMemo(()=>records.filter(r=>r.date?.slice(0,7)===monthNow()),[records]);
 const spent=monthRecords.filter(r=>r.type==='expense').reduce((s,r)=>s+r.amount,0);
 const income=monthRecords.filter(r=>r.type==='income').reduce((s,r)=>s+r.amount,0);
 const visible=records.filter(r=>(filter==='all'||r.type===filter)&&(`${r.title} ${r.category} ${r.note||''}`.toLowerCase().includes(query.toLowerCase()))).sort((a,b)=>b.date.localeCompare(a.date)||b.created-a.created);
 const categories=Object.entries(monthRecords.filter(r=>r.type==='expense').reduce((o,r)=>({...o,[r.category]:(o[r.category]||0)+r.amount}),{})).sort((a,b)=>b[1]-a[1]);

 const addRecord=()=> {
   const n=Number(amount);
   if(!title.trim()){Alert.alert('Missing detail','Enter what the transaction was for.');return;}
   if(!Number.isFinite(n)||n<=0){Alert.alert('Invalid amount','Enter an amount greater than zero.');return;}
   if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){Alert.alert('Invalid date','Use YYYY-MM-DD format.');return;}
   setRecords(old=>[{id:`${Date.now()}-${Math.random()}`,type:kind,title:title.trim(),amount:n,category,date,note:note.trim(),created:Date.now()},...old]);
   setTitle('');setAmount('');setNote('');setDate(dateNow());setTab('History');
 };
 const removeRecord=(id)=>Alert.alert('Delete record?','This transaction will be removed.',[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:()=>setRecords(old=>old.filter(r=>r.id!==id))}]);
 const saveBudget=()=>{const n=Number(budgetEdit);if(!Number.isFinite(n)||n<0){Alert.alert('Invalid budget','Enter zero or a positive amount.');return;}setBudget(String(n));Alert.alert('Budget saved',`Monthly spending budget: ${money(n)}`);};
 const Button=({label,onPress,active=false,style={}})=><TouchableOpacity onPress={onPress} style={[styles.button,active&&styles.activeButton,style]}><Text style={[styles.buttonText,active&&styles.activeButtonText]}>{label}</Text></TouchableOpacity>;
 const Card=({label,value,sub,color})=><View style={styles.statCard}><Text style={styles.muted}>{label}</Text><Text style={[styles.statValue,color?{color}:null]}>{value}</Text>{sub?<Text style={styles.tiny}>{sub}</Text>:null}</View>;
 const Section=({title,children})=><View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;

 if(!loaded) return <SafeAreaView style={styles.center}><Text style={styles.logo}>🪙 PennyTrack</Text><Text style={styles.muted}>Loading your records…</Text></SafeAreaView>;
 return <SafeAreaView style={styles.safe}>
  <StatusBar style="light"/>
  <View style={styles.header}><View><Text style={styles.logo}>🪙 PennyTrack</Text><Text style={styles.tagline}>Your money, in focus.</Text></View><View style={styles.headerBadge}><Text style={styles.headerBadgeText}>₹ INR</Text></View></View>
  <View style={styles.tabs}>{['Home','Add','History','Budget'].map(t=><TouchableOpacity key={t} onPress={()=>setTab(t)} style={[styles.tab,tab===t&&styles.tabSelected]}><Text style={[styles.tabText,tab===t&&styles.tabTextSelected]}>{({Home:'⌂',Add:'＋',History:'↻',Budget:'◎'})[t]} {t}</Text></TouchableOpacity>)}</View>
  <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
   {tab==='Home'&&<><Text style={styles.pageTitle}>Your overview</Text><Text style={styles.pageSub}>{new Date().toLocaleDateString('en-IN',{month:'long',year:'numeric'})}</Text><View style={styles.stats}><Card label="Spent this month" value={money(spent)} color="#d84b54"/><Card label="Income this month" value={money(income)} color="#16845b"/><Card label="Money left" value={money(income-spent)} color={income-spent<0?'#d84b54':'#183b32'} sub="Recorded income − expenses"/></View>
   <Section title="Spending by category">{categories.length?categories.map(([cat,val])=><View key={cat} style={styles.categoryRow}><Text style={styles.categoryName}>{ICONS[cat]||'📌'} {cat}</Text><View style={styles.track}><View style={[styles.fill,{width:`${Math.max(3,val/Math.max(...categories.map(x=>x[1]))*100)}%`}]} /></View><Text style={styles.categoryAmount}>{money(val)}</Text></View>):<Text style={styles.muted}>No expenses this month yet. Add a record to see your breakdown.</Text>}</Section>
   <Section title="Recent records">{records.length?records.slice(0,4).map(r=><Transaction key={r.id} r={r} onDelete={removeRecord}/>):<Text style={styles.muted}>Your transactions will appear here.</Text>}</Section>
   <Button label="＋ Add a transaction" onPress={()=>setTab('Add')} active style={{marginTop:4}}/></>}
   {tab==='Add'&&<><Text style={styles.pageTitle}>Add a record</Text><Text style={styles.pageSub}>Record money spent or received.</Text><Section title="Transaction type"><View style={styles.inline}><Button label="− Expense" active={kind==='expense'} onPress={()=>setKind('expense')} style={{flex:1}}/><Button label="+ Income" active={kind==='income'} onPress={()=>setKind('income')} style={{flex:1}}/></View>
   <Text style={styles.fieldLabel}>Description</Text><TextInput value={title} onChangeText={setTitle} placeholder="e.g. Lunch, bus fare, salary" style={styles.input} maxLength={70}/>
   <Text style={styles.fieldLabel}>Amount (₹)</Text><TextInput value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" style={styles.input}/>
   <Text style={styles.fieldLabel}>Category</Text><View style={styles.chips}>{CATEGORIES.map(c=><TouchableOpacity key={c} onPress={()=>setCategory(c)} style={[styles.chip,category===c&&styles.chipActive]}><Text style={[styles.chipText,category===c&&styles.chipTextActive]}>{ICONS[c]} {c}</Text></TouchableOpacity>)}</View>
   <Text style={styles.fieldLabel}>Date (YYYY-MM-DD)</Text><TextInput value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" style={styles.input}/>
   <Text style={styles.fieldLabel}>Note (optional)</Text><TextInput value={note} onChangeText={setNote} placeholder="Extra details" style={styles.input} maxLength={120}/>
   <Button label="Save transaction" onPress={addRecord} active style={{marginTop:18}}/></Section></>}
   {tab==='History'&&<><Text style={styles.pageTitle}>Transaction history</Text><Text style={styles.pageSub}>{records.length} total record{records.length===1?'':'s'}</Text><TextInput value={query} onChangeText={setQuery} placeholder="Search description or category…" style={styles.input}/><View style={styles.inlineFilter}>{[['all','All'],['expense','Expenses'],['income','Income']].map(([v,l])=><Button key={v} label={l} active={filter===v} onPress={()=>setFilter(v)} style={{flex:1}}/>)}</View>{visible.length?visible.map(r=><Transaction key={r.id} r={r} onDelete={removeRecord}/>):<View style={styles.empty}><Text style={{fontSize:30}}>🧾</Text><Text style={styles.muted}>No matching records.</Text></View>}</>}
   {tab==='Budget'&&<><Text style={styles.pageTitle}>Monthly budget</Text><Text style={styles.pageSub}>Set a limit and keep your spending in check.</Text><Section title="Your spending limit"><Text style={styles.fieldLabel}>Monthly budget (₹)</Text><TextInput value={budgetEdit} onChangeText={setBudgetEdit} keyboardType="decimal-pad" style={styles.input}/><Button label="Save budget" active onPress={saveBudget} style={{marginTop:12}}/><View style={styles.budgetBox}><Text style={styles.muted}>Spent this month</Text><Text style={styles.bigNumber}>{money(spent)}</Text><View style={styles.trackLarge}><View style={[styles.fill,{width:`${Math.min(100,Number(budget)>0?spent/Number(budget)*100:spent>0?100:0)}%`,backgroundColor:spent>Number(budget)?'#d84b54':'#16845b'}]}/></View><Text style={[styles.budgetRemaining,{color:spent>Number(budget)?'#d84b54':'#16845b'}]}>{Number(budget)>0?(spent>Number(budget)?`${money(spent-Number(budget))} over budget`:`${money(Number(budget)-spent)} remaining`):'Set a budget above zero to track your limit'}</Text><Text style={styles.tiny}>{Number(budget)>0?`${Math.round(spent/Number(budget)*100)}% of your budget used`:''}</Text></View></Section><Section title="A helpful tip"><Text style={styles.muted}>Record small purchases too. They add up, and accurate records make your budget more useful.</Text></Section></>}
   <Text style={styles.privacy}>🔒 Saved on this device. No bank connection or account required.</Text>
  </ScrollView>
 </SafeAreaView>;
}
function Transaction({r,onDelete}) {
 return <View style={styles.tx}><View style={styles.txIcon}><Text style={{fontSize:20}}>{ICONS[r.category]||'📌'}</Text></View><View style={{flex:1}}><Text style={styles.txTitle}>{r.title}</Text><Text style={styles.txMeta}>{r.category} · {r.date}{r.note?`\n${r.note}`:''}</Text><TouchableOpacity onPress={()=>onDelete(r.id)}><Text style={styles.deleteText}>Delete record</Text></TouchableOpacity></View><Text style={[styles.txAmount,{color:r.type==='income'?'#16845b':'#d84b54'}]}>{r.type==='income'?'+':'−'}{money(r.amount)}</Text></View>;
}
const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:'#f4f7fb'},center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#f4f7fb'},header:{backgroundColor:'#123c32',paddingHorizontal:20,paddingTop:14,paddingBottom:20,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},logo:{color:'#fff',fontSize:24,fontWeight:'900',letterSpacing:-.5},tagline:{color:'#d0e8dc',marginTop:3},headerBadge:{borderRadius:20,backgroundColor:'#245548',paddingHorizontal:12,paddingVertical:7},headerBadgeText:{color:'#fff',fontWeight:'800'},tabs:{flexDirection:'row',backgroundColor:'#fff',paddingHorizontal:8,paddingVertical:8,borderBottomWidth:1,borderColor:'#e5eaf1'},tab:{flex:1,alignItems:'center',paddingVertical:10,borderRadius:11},tabSelected:{backgroundColor:'#e5f4eb'},tabText:{fontSize:12,fontWeight:'700',color:'#6b7788'},tabTextSelected:{color:'#126444'},content:{padding:16,paddingBottom:32},pageTitle:{fontSize:25,fontWeight:'900',color:'#182230',letterSpacing:-.5},pageSub:{fontSize:13,color:'#6b7788',marginTop:3,marginBottom:17},stats:{gap:10,marginBottom:18},statCard:{backgroundColor:'#fff',borderWidth:1,borderColor:'#e5eaf1',borderRadius:16,padding:16},muted:{color:'#6b7788',fontSize:13,lineHeight:19},statValue:{fontSize:26,fontWeight:'900',color:'#182230',marginTop:5},tiny:{fontSize:11,color:'#8a96a5',marginTop:4},section:{backgroundColor:'#fff',borderWidth:1,borderColor:'#e5eaf1',borderRadius:16,padding:16,marginBottom:15},sectionTitle:{fontSize:17,fontWeight:'800',color:'#182230',marginBottom:13},categoryRow:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:13},categoryName:{width:100,fontSize:12,fontWeight:'650',color:'#354253'},track:{flex:1,height:8,backgroundColor:'#edf1f5',borderRadius:9,overflow:'hidden'},fill:{height:'100%',backgroundColor:'#16845b',borderRadius:9},categoryAmount:{width:75,textAlign:'right',fontSize:12,fontWeight:'750',color:'#182230'},button:{paddingVertical:12,paddingHorizontal:13,borderRadius:11,backgroundColor:'#eef2f6',alignItems:'center',justifyContent:'center'},activeButton:{backgroundColor:'#16845b'},buttonText:{fontWeight:'750',color:'#425064',fontSize:13},activeButtonText:{color:'#fff'},inline:{flexDirection:'row',gap:9,marginBottom:13},fieldLabel:{fontSize:13,fontWeight:'750',color:'#344054',marginTop:13,marginBottom:7},input:{backgroundColor:'#fff',borderWidth:1,borderColor:'#dbe3eb',borderRadius:11,paddingHorizontal:13,paddingVertical:12,fontSize:15,color:'#182230'},chips:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:2},chip:{borderWidth:1,borderColor:'#e0e6ed',borderRadius:20,paddingVertical:8,paddingHorizontal:11,backgroundColor:'#fff'},chipActive:{backgroundColor:'#e5f4eb',borderColor:'#16845b'},chipText:{fontSize:12,color:'#485568',fontWeight:'650'},chipTextActive:{color:'#126444'},tx:{flexDirection:'row',alignItems:'flex-start',gap:11,paddingVertical:13,borderBottomWidth:1,borderBottomColor:'#edf0f4'},txIcon:{width:42,height:42,borderRadius:13,backgroundColor:'#eef7f2',alignItems:'center',justifyContent:'center'},txTitle:{fontSize:14,fontWeight:'800',color:'#182230'},txMeta:{fontSize:11,color:'#778394',marginTop:3,lineHeight:16},txAmount:{fontSize:14,fontWeight:'900',marginTop:2},deleteText:{fontSize:11,color:'#9a5360',marginTop:5,fontWeight:'650'},inlineFilter:{flexDirection:'row',gap:8,marginTop:10,marginBottom:6},empty:{alignItems:'center',padding:28,gap:8},privacy:{textAlign:'center',color:'#8793a2',fontSize:11,marginTop:3,marginBottom:6},budgetBox:{backgroundColor:'#f5f8fa',padding:15,borderRadius:13,marginTop:18},bigNumber:{fontSize:29,fontWeight:'900',color:'#182230',marginTop:5},trackLarge:{height:11,backgroundColor:'#e3e9ed',borderRadius:10,overflow:'hidden',marginTop:14},budgetRemaining:{fontWeight:'800',marginTop:10,fontSize:14}}
);

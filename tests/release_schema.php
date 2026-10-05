<?php
declare(strict_types=1);
$wt=dirname(__DIR__);
require $wt.'/vendor/autoload.php';
(new think\App($wt))->initialize();
set_exception_handler(static function(Throwable $e):void{fwrite(STDERR,'Fresh schema probe failed: '.get_class($e).(get_class($e)===RuntimeException::class?' '.$e->getMessage():'').PHP_EOL);exit(1);});
$env=app()->env;
if(!app()->isDebug())throw new RuntimeException('Local debug environment only');
if($env->get('DB_HOST','127.0.0.1')!=='127.0.0.1')throw new RuntimeException('Loopback MySQL only');
$schema=file_get_contents($wt.'/sql/schema.sql');
if(preg_match('/\b(?:USE\s+[`\w]|(?:CREATE|DROP)\s+DATABASE)\b/i',$schema)||preg_match('/`?lostsky`?\s*\./i',$schema))throw new RuntimeException('Unsafe schema target');
$name='lostsky_release_probe_'.bin2hex(random_bytes(8));
if(!preg_match('/^lostsky_release_probe_[a-f0-9]{16}$/D',$name)||$name==='lostsky')throw new RuntimeException('Unsafe fixture name');
$manifest=sys_get_temp_dir().'/'.$name.'.json';file_put_contents($manifest,json_encode(['database'=>$name,'schema_sha256'=>hash('sha256',$schema),'state'=>'planned']));
$pdo=new PDO('mysql:host=127.0.0.1;port='.$env->get('DB_PORT',3306).';charset=utf8mb4',(string)$env->get('DB_USER','root'),(string)$env->get('DB_PASS',''),[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$created=false;$statements=[];$buffer='';$quote=null;$lineComment=false;$blockComment=false;
for($i=0,$n=strlen($schema);$i<$n;$i++){
    $c=$schema[$i];$next=$schema[$i+1]??'';
    if($lineComment){if($c==="\n"){$lineComment=false;$buffer.="\n";}continue;}
    if($blockComment){if($c==='*'&&$next==='/'){$blockComment=false;$i++;}continue;}
    if($quote!==null){
        $buffer.=$c;
        if($c==='\\'&&$quote!=='`'&&$i+1<$n){$buffer.=$schema[++$i];continue;}
        if($c===$quote){if($next===$quote){$buffer.=$schema[++$i];}else{$quote=null;}}
        continue;
    }
    if($c==='-'&&$next==='-'&&ctype_space($schema[$i+2]??' ')){$lineComment=true;$i++;continue;}
    if($c==='/'&&$next==='*'){$blockComment=true;$i++;continue;}
    if($c==="'"||$c==='"'||$c==='`'){$quote=$c;$buffer.=$c;continue;}
    if($c===';'){if(trim($buffer)!=='')$statements[]=trim($buffer);$buffer='';}
    else{$buffer.=$c;}
}
if($quote!==null||$blockComment)throw new RuntimeException('Unterminated SQL token');
if(trim($buffer)!=='')$statements[]=trim($buffer);
foreach($statements as $sql){
    if(!preg_match('/^(?:CREATE TABLE(?: IF NOT EXISTS)?|ALTER TABLE|INSERT INTO) `[a-z_]+`/i',$sql))throw new RuntimeException('Unsupported initialization statement');
}
$exit=0;
try {
 $pdo->exec('CREATE DATABASE `'.$name.'` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');$created=true;
 $pdo->exec('USE `'.$name.'`');
 foreach($statements as $index=>$sql){if($pdo->query('SELECT DATABASE()')->fetchColumn()!==$name)throw new RuntimeException('Target changed');try{$pdo->exec($sql);}catch(PDOException $e){preg_match('/^(?:CREATE|ALTER) TABLE `([^`]+)`/i',$sql,$table);echo 'SCHEMA_STATEMENT_FAILED index='.($index+1).' table='.($table[1]??'unknown').' SQLSTATE='.$e->getCode().' MYSQL_CODE='.($e->errorInfo[1]??0).PHP_EOL;throw $e;}}
 preg_match_all('/CREATE TABLE(?: IF NOT EXISTS)? `([^`]+)`/i',$schema,$m);$expected=$m[1];sort($expected);
 $actual=$pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);sort($actual);
 if($actual!==$expected)throw new RuntimeException('Fresh table baseline mismatch');
 preg_match_all('/(?:ADD )?CONSTRAINT `([^`]+)` FOREIGN KEY/i',$schema,$m);$expectedFk=$m[1];sort($expectedFk);
 $q=$pdo->prepare('SELECT CONSTRAINT_NAME FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=?');$q->execute([$name]);$actualFk=$q->fetchAll(PDO::FETCH_COLUMN);sort($actualFk);
 if($actualFk!==$expectedFk)throw new RuntimeException('Fresh FK baseline mismatch');
 preg_match_all('/CONSTRAINT `([^`]+)` FOREIGN KEY \(`([^`]+)`\) REFERENCES `([^`]+)` \(`([^`]+)`\)/i',$schema,$links,PREG_SET_ORDER);
 $expectedLinks=[];foreach($links as $link)$expectedLinks[$link[1]]=[$link[2],$link[3],$link[4]];
 $q=$pdo->prepare('SELECT CONSTRAINT_NAME,COLUMN_NAME,REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME,REFERENCED_TABLE_SCHEMA FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=? AND REFERENCED_TABLE_NAME IS NOT NULL');$q->execute([$name]);
 $actualLinks=[];foreach($q->fetchAll(PDO::FETCH_ASSOC)as $link){if($link['REFERENCED_TABLE_SCHEMA']!==$name)throw new RuntimeException('Cross-database foreign key');$actualLinks[$link['CONSTRAINT_NAME']]=[$link['COLUMN_NAME'],$link['REFERENCED_TABLE_NAME'],$link['REFERENCED_COLUMN_NAME']];}
 ksort($expectedLinks);ksort($actualLinks);if(count($expectedLinks)!==count($expectedFk)||$expectedLinks!==$actualLinks)throw new RuntimeException('Fresh FK column metadata mismatch');
 $expectedTableMeta=[];
 foreach($statements as $sql){if(preg_match('/^CREATE TABLE(?: IF NOT EXISTS)? `([^`]+)`.*\) ENGINE=(\w+) DEFAULT CHARSET=(\w+)(?: COLLATE=(\w+))?/si',$sql,$table))$expectedTableMeta[$table[1]]=[$table[2],$table[3],$table[4]??null];}
 $q=$pdo->prepare('SELECT TABLE_NAME,ENGINE,TABLE_COLLATION FROM information_schema.TABLES WHERE TABLE_SCHEMA=?');$q->execute([$name]);
 foreach($q->fetchAll(PDO::FETCH_ASSOC)as $table){[$engine,$charset,$collation]=$expectedTableMeta[$table['TABLE_NAME']]??throw new RuntimeException('Missing schema table metadata');if($table['ENGINE']!==$engine||($collation!==null?$table['TABLE_COLLATION']!==$collation:!str_starts_with($table['TABLE_COLLATION'],$charset.'_')))throw new RuntimeException('Fresh table engine/collation mismatch');}
 if((int)$pdo->query("SELECT COUNT(*) FROM platform_admin_role WHERE role_key='super_admin' AND is_system=1")->fetchColumn()!==1||(int)$pdo->query('SELECT COUNT(*) FROM platform_admin_role')->fetchColumn()!==1)throw new RuntimeException('Fresh administrator role seed mismatch');
 echo 'FRESH_SCHEMA_METADATA_PASS fk_columns='.count($actualLinks).' engine=InnoDB charset=utf8mb4 seed=super_admin'.PHP_EOL;
 echo 'FRESH_SCHEMA_PASS statements='.count($statements).' tables='.count($actual).' foreign_keys='.count($actualFk).PHP_EOL;
 foreach($env->get()as $key=>$value)if(is_scalar($value))putenv('PHP_'.$key.'='.$value);
 putenv('PHP_DB_NAME='.$name);
 $proc=proc_open([PHP_BINARY,'tests/foreign_keys.php'],[0=>STDIN,1=>STDOUT,2=>STDERR],$pipes,$wt);$code=proc_close($proc);if($code!==0)throw new RuntimeException('Fresh foreign key test failed');
 file_put_contents($manifest,json_encode(['database'=>$name,'schema_sha256'=>hash('sha256',$schema),'state'=>'verified']));
} catch(Throwable $e){echo 'FRESH_SCHEMA_FAILED class='.get_class($e).(get_class($e)===RuntimeException::class?' '.$e->getMessage():'').PHP_EOL;$exit=1;}
finally {
 if($created){if(!preg_match('/^lostsky_release_probe_[a-f0-9]{16}$/D',$name)||$pdo->query('SELECT DATABASE()')->fetchColumn()!==$name)throw new RuntimeException('Cleanup guard failed');$pdo->exec('DROP DATABASE `'.$name.'`');$q=$pdo->prepare('SELECT COUNT(*) FROM information_schema.SCHEMATA WHERE SCHEMA_NAME=?');$q->execute([$name]);if((int)$q->fetchColumn()!==0)throw new RuntimeException('Database cleanup failed');echo 'FRESH_SCHEMA_OWN_DATABASE_DROP_VERIFIED'.PHP_EOL;}
 file_put_contents($manifest,json_encode(['database'=>$name,'schema_sha256'=>hash('sha256',$schema),'state'=>$exit?'failed_and_cleaned':'verified_and_cleaned']));
}
exit($exit);

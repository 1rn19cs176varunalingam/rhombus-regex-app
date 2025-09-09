from django.shortcuts import render
from openai import OpenAI
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import FileResponse
import os
import pandas as pd
import io
import numpy as np
import re
import json
import uuid
import boto3
import requests
import time
from pyspark.sql import SparkSession
from pyspark.sql.functions import regexp_replace
# Create your views here.

def upload_s3(local_path, bucket, s3_key):
    s3 = boto3.client('s3')
    s3.upload_file(local_path, bucket, s3_key)
    return f"s3://{bucket}/{s3_key}"





class HealthView(APIView):
    def get(self, request):
        return Response({"status": "ok"})
class UploadPreviewView(APIView):
    def post(self,request):
        file=request.FILES.get("file")
        if not file:
            return Response({"error":"No file provided"},status=status.HTTP_400_BAD_REQUEST)
        else:
            fname=file.name
            ext=os.path.splitext(fname)[1].lower()
            if ext not in [".csv",".xlsx"]:
                return Response({"error":"Unsupported file type"},status=status.HTTP_400_BAD_REQUEST)
            try:
                if ext==".csv":
                    raw=file.read()
                    try:
                        df=pd.read_csv(io.BytesIO(raw))
                    except UnicodeDecodeError:
                        df=pd.read_csv(io.BytesIO(raw),encoding="latin-1")
                else:
                    df=pd.read_excel(file)
            except Exception as e:
                return Response({"error":str(e)},status=status.HTTP_400_BAD_REQUEST)
            preview=df.head(5).replace({np.nan: None}).to_dict(orient="records")
            return Response({"filename":fname,"preview":preview,"columns":df.columns.tolist()})
class TransformView(APIView):
    def post(self,request):
        f=request.FILES.get("file")
        if not f:
            return Response({"error":"No file provided"},status=status.HTTP_400_BAD_REQUEST)
        else:
            fname=f.name
            ext=os.path.splitext(fname)[1].lower()
            if ext not in [".csv",".xlsx"]:
                return Response({"error":"Unsupported file type"},status=status.HTTP_400_BAD_REQUEST)
            try:
                if ext==".csv":
                    raw=f.read()
                    try:
                        df=pd.read_csv(io.BytesIO(raw))
                    except UnicodeDecodeError:
                        df=pd.read_csv(io.BytesIO(raw),encoding="latin-1")
                else:
                    df=pd.read_excel(f)
            except Exception as e:
                return Response({"error":str(e)},status=status.HTTP_400_BAD_REQUEST)
            pandas_code=request.POST.get("pandas_code","").strip()
            if pandas_code:
                local_vars={"df":df.copy(),"pd":pd,"np":np}
                target_cols=list(df.columns)
                if not target_cols:
                    return Response({"error":"No valid target columns found"},status=status.HTTP_400_BAD_REQUEST)
                try:
                    exec(pandas_code,{},local_vars)
                    df1=local_vars["df"]
                except Exception as e:
                    return Response({"error":f"Error executing pandas code: {str(e)}"},status=status.HTTP_400_BAD_REQUEST)
                token= str(uuid.uuid4())
                file_path=f"/tmp/{token}.json"
                df1.to_csv(file_path,index=False)

                before = df.head(5).to_dict(orient="records")
                after = df1.head(5).to_dict(orient="records")
                common_index = df.index.intersection(df1.index)
                common_cols = [col for col in target_cols if col in df1.columns]
                df_aligned = df.loc[common_index, common_cols]
                df1_aligned = df1.loc[common_index, common_cols]

                changed = (df_aligned.astype(str) != df1_aligned.astype(str))
                changes = []
                matches = 0
                for idx, row in changed.iterrows():
                    for col in common_cols:
                        if row[col]:
                            matches += 1
                            changes.append({
                            "row": int(idx + 1),
                            "column": col,
                            "original_value": df.at[idx, col] if pd.notna(df.at[idx, col]) else None,
                            "new_value": df1.at[idx, col] if pd.notna(df1.at[idx, col]) else None
                        })
                preview_changes = changes[:10]
                return Response({
                    "filename":fname,"columns":list(target_cols),
                                "shape":df.shape,"matches":int(matches),"before":before,"after":after,"changes":preview_changes,
                                "download_token":token
                })
            else:
                cols_param=request.POST.get("columns")
                if cols_param:
                    target_cols=[c.strip() for c in cols_param.split(",") if c.strip() in df.columns]
                else:
                    target_cols=[c for c in df.columns if pd.api.types.is_string_dtype(df[c]) or df[c].dtype==object]
                if not target_cols:
                    return Response({"error":"No valid target columns found"},status=status.HTTP_400_BAD_REQUEST)
                regex_pattern=request.POST.get("pattern") or ""
                if regex_pattern.strip()=="":
                    return Response({"error":"No regex pattern provided"},status=status.HTTP_400_BAD_REQUEST)
                replacement=request.POST.get("replacement") or ""


                flags_param = (request.POST.get("flags") or "").lower()
                re_flags = 0
                if "i" in flags_param: re_flags |= re.IGNORECASE
                if "m" in flags_param: re_flags |= re.MULTILINE
                if "s" in flags_param: re_flags |= re.DOTALL
                try:
                    rx=re.compile(regex_pattern,re_flags)
                except re.error as e:
                    return Response({"error":f"Invalid regex pattern: {str(e)}"},status=status.HTTP_400_BAD_REQUEST)
                before=[]
                matches=0
                df1=df.copy()
                for col in target_cols:
                    matches+=df[col].astype(str).apply(lambda x: bool(rx.search(x)) if x not in [None,"nan","NaN"] else False).sum()
                    df1[col]=df[col].astype(str).apply(lambda x: rx.sub(replacement,x) if x not in [None,"nan","NaN"] else x)
                changed=(df[target_cols].astype(str)!=df1[target_cols].astype(str))
                changes=[]

                for idx,row in changed.iterrows():
                    for col in target_cols:
                        if row[col]:
                            changes.append({"row":int(idx+1),"column":col,"original_value":df.at[idx,col] if pd.notna(df.at[idx,col]) else None,
                                            "new_value":df1.at[idx,col] if pd.notna(df1.at[idx,col]) else None})
                preview_changes=changes[:10]
                token = str(uuid.uuid4())
                file_path = f"/tmp/{token}.csv"
                df1.to_csv(file_path, index=False)
                before=df[target_cols].head(5).replace({np.nan:None}).to_dict(orient="records")
                for col in target_cols:
                    matches+=df[col].astype(str).apply(lambda x: bool(rx.search(x)) if x not in [None,"nan","NaN"] else False).sum()
                    df[col]=df[col].astype(str).apply(lambda x: rx.sub(replacement,x) if x not in [None,"nan","NaN"] else x)
                after=df[target_cols].head(5).replace({np.nan:None}).to_dict(orient="records")
                return Response({"filename":fname,"columns":list(target_cols),"regex_pattern":regex_pattern,"replacement":replacement,
                                "shape":df.shape,"matches":int(matches),"before":before,"after":after,"changes":preview_changes,
                                "download_token":token})

        
class NL2RegexView(APIView):
    def post(self,request):
        instruction=request.data.get("instruction","").strip()
        columns=request.data.get("columns",[])
        rows=request.data.get("rows",[])
        no=request.data.get("no",[])

        if not instruction:
            return Response({"error":"No instruction provided"},status=status.HTTP_400_BAD_REQUEST)
        api_key=os.getenv("OPENAI_API_KEY")
        if not api_key:
            return Response({"error":"OpenAI API key not configured"},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        try:
            client=OpenAI(api_key=api_key)
            sys=(
              "You are a converter from natural-language instructions into REGEX + REPLACEMENT + FLAGS + TARGET COLUMNS. "
  "Output JSON with: 'pattern', 'replacement', 'flags', 'suggested_columns'. "
  "- 'pattern': Python regex. "
  "- 'replacement': literal or group-aware replacement string. "
  "- 'flags': use short letters only: 'i' for IGNORECASE, 'm' for MULTILINE, 's' for DOTALL. "
  "- 'suggested_columns': pick from provided columns. "
  "- 'pandas_code' : If the transformation cannot be done with regex, generate a pandas DataFrame code snippet to do it. Example: 'double the age column' → df['age'] = df['age'] * 2. or like filtering of dob and remove the other that are not then provide the code snippet. if it could be done using only regex pattern then don't provide them.If numeric comparison is needed, always convert the column to numeric using pd.to_numeric(df['col'], errors='coerce') before comparing. if you are providing me pattern then don;t proivde me with pandas_code "
  "Return JSON only."
  "Only generate regex patterns that are compatible with Python's re module. because you do that a lot Do not use variable-width look-behind or look-ahead. you can test it once before sending such patterns"
  "I'll also be generating a sample rows for you attached and also the total no of rows."
  "")
            user_msg=f"Instruction: {instruction}\nAvailable Columns: {columns}\nSample Rows: {rows}\nTotal No of Rows: {no}\n"

            resp=client.chat.completions.create(
                model="gpt-4o-mini"
                ,messages=[{"role":"system","content":sys},
                          {"role":"user","content":user_msg}],
                          temperature=0.2,
                          max_tokens=200,
            )
            fulloutput=resp.choices[0].message.content.strip()

            parsed=json.loads(fulloutput)
            pattern=parsed.get("pattern","")
            replacement=parsed.get("replacement","")
            flags=parsed.get("flags","")
            suggested_columns=parsed.get("suggested_columns",[])
            pandas_code=parsed.get("pandas_code","")

        except Exception as e:
            return Response({"error":f"Error generating regex: {str(e)}"},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({"pattern":pattern,"replacement":replacement,"suggested_columns":suggested_columns,"flags":flags,"pandas_code":pandas_code})
class RegexRiskAnalyzer(APIView):
    def post(self,request):
        pattern=(request.data or {}).get("pattern","").strip()
        replacement=(request.data or {}).get("replacement","").strip()
        allColumns=(request.data or {}).get("allColumns",[])
        selectedColumns=(request.data or {}).get("selectedColumns",[])
        sampleRows=(request.data or {}).get("sampleRows",[])
        instructions=(request.data or {}).get("instructions","").strip()

        if not pattern:
            return Response({"error":"No regex pattern provided"},status=status.HTTP_400_BAD_REQUEST)
        try:
            re.compile(pattern)
        except re.error as e:
            return Response({"error":f"Invalid regex pattern: {str(e)}"},status=status.HTTP_400_BAD_REQUEST)
        client=OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        sys=(        "You are a regex risk analyzer and intent safety checker. "
    "Given a regex pattern, replacement, selected columns, sample rows, and user instructions, "
    "output JSON with two fields: "
    "'risk_percent' (an integer from 0 to 100, estimating the combined risk of this pattern causing technical issues "
    "like catastrophic backtracking, false positives, or performance problems, AND the risk that the user's intent is malicious, unethical, or dangerous), "
    "and 'reason' (a one-line explanation for the risk score, mentioning both technical and intent factors if relevant). "
    "Example: {'risk_percent': 80, 'reason': 'Pattern has nested quantifiers (technical risk) and user intent is to delete sensitive data (intent risk).'} "
    "Be concise and accurate. Only output valid JSON.")
        resp=client.chat.completions.create(
            model="gpt-4o-mini"
            ,messages=[{"role":"system","content":sys},
                      {"role":"user","content":f"Regex Pattern: {pattern} \nReplacement: {replacement}\nAll Columns: {allColumns}\nSelected Columns: {selectedColumns}\nSample Rows: {sampleRows}\nInstructions: given by user : {instructions}"}],
                      temperature=0.3,
                      max_tokens=300,
        )
        result = resp.choices[0].message.content.strip()
        try:
            parsed = json.loads(result)
            risk_percent = parsed.get("risk_percent", 0)
            reason = parsed.get("reason", "")
        except Exception as e:
            return Response({"error": f"Could not parse risk assessment: {str(e)}", "raw": result}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({"pattern": pattern, "risk_percent": risk_percent, "reason": reason})  
    
class DownloadTransformedView(APIView):
    def get(self, request):
            token = request.GET.get("token")
            file_path = f"/tmp/{token}.csv"
            if not os.path.exists(file_path):
                return Response({"error": "File not found"}, status=404)
            return FileResponse(open(file_path, "rb"), as_attachment=True, filename="changed_file.csv")

class Databricks(APIView):
    def post(self,request):
        f=request.FILES.get("file")
        if not f:
            return Response({"error":"No file provided"},status=status.HTTP_400_BAD_REQUEST)
        else:
            fname=f.name
            ext=os.path.splitext(fname)[1].lower()
            temp_path = f"/tmp/{uuid.uuid4()}{ext}"
            with open(temp_path, "wb") as temp_file:
                temp_file.write(f.read())


        s3_bucket = "rhombus-regex-app-bucket"
        s3_key = f"uploads/{uuid.uuid4()}{ext}"
        s3_input_path = upload_s3(temp_path, s3_bucket, s3_key)
        s3_output_key = f"outputs/{uuid.uuid4()}{ext}"
        s3_output_path = f"s3://{s3_bucket}/{s3_output_key}"

        # 3. Submit Databricks job
        DATABRICKS_INSTANCE = "https://<your-instance>.cloud.databricks.com"
        DATABRICKS_TOKEN = "<your-databricks-token>"
        CLUSTER_ID = "<your-cluster-id>"
        NOTEBOOK_PATH = "/Users/youruser/your_notebook"

        pattern=request.POST.get("pattern","")
        replacement=request.POST.get("replacement","")
        columns=request.POST.get("columns","")
        headers = {"Authorization": f"Bearer {DATABRICKS_TOKEN}"}
        payload = {
            "run_name": "Large File Processing",
            "existing_cluster_id": CLUSTER_ID,
            "notebook_task": {
                "notebook_path": NOTEBOOK_PATH,
                "base_parameters": {
                    "input_path": s3_input_path,
                    "output_path": s3_output_path,
                    "pattern": pattern,
                    "replacement": replacement,
                    "columns": columns
                }
            }
        }
        resp=request.post(f"{DATABRICKS_INSTANCE}/api/2.1/jobs/runs/submit", headers=headers, json=payload)
        if resp.status_code!=200:
            return Response({"error":"Error submitting Databricks job","details":resp.text},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        run_id=resp.json().get("run_id")
        while True:
            status_resp=requests.get(f"{DATABRICKS_INSTANCE}/api/2.1/jobs/runs/get?run_id={run_id}", headers=headers)
            state=status_resp.json()["state"]["life_cycle_state"]
            if state in ["TERMINATED","SKIPPED","INTERNAL_ERROR"]:
                break
            time.sleep(10)
        s3=boto3.client('s3')
        try:
            presigned_url=s3.generate_presigned_url(
                'get_object',
                Params={'Bucket':s3_bucket,'Key':s3_output_key},
                ExpiresIn=3600
            )
        except Exception as e:
            return Response({"error":f"Error generating presigned URL: {str(e)}"},status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({"download_url":presigned_url, "filename":fname,"engine":"databricks"})
class LocalSparkTransformView(APIView):
    def post(self,request):
        f=request.FILES.get("file")
        if not f:
            return Response({"error":"No file provided"},status=status.HTTP_400_BAD_REQUEST)
        else:
            fname=f.name
            ext=os.path.splitext(fname)[1].lower()
            temp_path = f"/tmp/{uuid.uuid4()}{ext}"
            with open(temp_path, "wb") as temp_file:
                temp_file.write(f.read())
        try:
            spark = SparkSession.builder.appName("RegexTransform").getOrCreate()
            if ext == ".csv":
                df = spark.read.csv(temp_path, header=True, inferSchema=True)
            elif ext in [".xlsx", ".xls"]:
                df = spark.read.format("com.crealytics.spark.excel") \
                    .option("useHeader", "true") \
                    .option("treatEmptyValuesAsNulls", "true") \
                    .option("inferSchema", "true") \
                    .load(temp_path)
            else:
                return Response({"error": "Unsupported file type"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Error reading file with Spark: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        pattern = request.POST.get("pattern", "")
        replacement = request.POST.get("replacement", "")
        columns = request.POST.get("columns", "")
        if isinstance(columns, str):
            columns = [c.strip() for c in columns.split(",") if c.strip()]

        for col in columns:
            df = df.withColumn(col, regexp_replace(col, pattern, replacement))

        token = str(uuid.uuid4())
        output_path = f"/tmp/{token}.csv"
        df.coalesce(1).write.csv(output_path, header=True, mode="overwrite")
        preview = df.limit(5).toPandas().to_dict(orient="records")

        return Response({
            "filename": fname,
            "columns": df.columns,
            "preview": preview,
            "download_token": token,
            "engine": "pyspark"
        })

            
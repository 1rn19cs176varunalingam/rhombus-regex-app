from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import os
import pandas as pd
import io
import numpy as np
import re
# Create your views here.
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
            before=df[target_cols].head(5).replace({np.nan:None}).to_dict(orient="records")
            for col in target_cols:
                matches+=df[col].astype(str).apply(lambda x: bool(rx.search(x)) if x not in [None,"nan","NaN"] else False).sum()
                df[col]=df[col].astype(str).apply(lambda x: rx.sub(replacement,x) if x not in [None,"nan","NaN"] else x)
            after=df[target_cols].head(5).replace({np.nan:None}).to_dict(orient="records")
            return Response({"filename":fname,"columns":list(map(str,df.columns)),"regex_pattern":regex_pattern,"replacement":replacement,
                             "shape":df.shape,"matches":int(matches),"before":before,"after":after,})
        
            
        

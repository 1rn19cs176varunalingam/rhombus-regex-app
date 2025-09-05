from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import os
import pandas as pd
import io
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
            preview=df.head(5).to_dict(orient="records")
            return Response({"filename":fname,"preview":preview,"columns":df.columns.tolist()})
            
        

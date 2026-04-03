import joblib
import pandas as pd

heat_model      = joblib.load('model_artifacts/heat_model.pkl')
infection_model = joblib.load('model_artifacts/infection_model.pkl')
heat_img_model  = joblib.load('model_artifacts/heat_model_from_images.pkl')

# Test heat
df = pd.DataFrame([{'species':'cow','activity_spike':0.8,'restlessness':0.7,'mounting_events':0.6,'vision_model_score':0.75}])
prob = round(float(heat_model.predict_proba(df)[0][1]), 4)
print(f'Heat model OK — cow heat prob: {prob}')

# Test infection
df2 = pd.DataFrame([{'species':'goat','abnormal_discharge':0.7,'purulent_discharge':0.6,'swelling_or_lesion':0.5,'fever':0.4,'blood_contamination':0.3,'foul_smell':0.5,'repeat_ai_failure_history':0.2}])
prob2 = round(float(infection_model.predict_proba(df2)[0][1]), 4)
print(f'Infection model OK — goat infection prob: {prob2}')

# Test image model
df3 = pd.DataFrame([{'species':'cow','activity_spike':0.6,'restlessness':0.5,'mounting_events':0.4,'vision_model_score':0.55}])
prob3 = round(float(heat_img_model.predict_proba(df3)[0][1]), 4)
print(f'Image model OK — cow heat prob: {prob3}')

print('All models loaded and working correctly!')

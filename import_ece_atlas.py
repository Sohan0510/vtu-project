from pymongo import MongoClient

ROSTER_DATA = """Jaseem Mohammed\t1RF21EC023\t-
Naveen Ranjan\t1RF22EC024\t-
Aadyot Nandan S\t1RF23EC001\t8.62
Adithi Sreenivas\t1RF23EC003\t8.93
Aditya Jaiswal\t1RF23EC004\t8.45
Aditya Singh\t1RF23EC005\t8.06
Ahmed Ali Khan\t1RF23EC006\t7.22
AKASH\t1RF23EC007\t-
AKASH AMBANNA PADANUR\t1RF23EC008\t-
AMRUTHA S\t1RF23EC009\t6.94
Aneesh P Bhagvat\t1RF23EC010\t7.95
ANISH MANAGOND\t1RF23EC011\t-
ANKITH R\t1RF23EC012\t-
ANSHUL K ATHREYA\t1RF23EC013\t-
ANURAG SINHA\t1RF23EC014\t7.31
Anushka M\t1RF23EC015\t7.45
AYUSH KUMAR\t1RF23EC016\t8.02
Sathvik Reddy\t1RF23EC017\t7.55
BALAJI P GARLPET\t1RF23EC018\t7.93
Barsha V\t1RF23EC019\t6.88
BASAVARAJ IDARAMANI\t1RF23EC020\t8.44
BHAVANA B V\t1RF23EC021\t9.18
CHAITHRA SHREE MS\t1RF23EC022\t7.96
CHUNDURU SIREESHA\t1RF23EC023\t8.49
D GAURAV RAHTOR\t1RF23EC024\t8.31
Debarghya Chandra\t1RF23EC025\t6.61
DIVYA.M\t1RF23EC026\t8.33
Ganashree R\t1RF23EC027\t-
Gouthami M S\t1RF23EC028\t7.98
Gowri Y\t1RF23EC029\t7.62
Harrsha R\t1RF23EC030\t4.77
Harshith BA\t1RF23EC031\t6.41
Harshitha B S\t1RF23EC032\t7.29
Harshawardhan Sharma\t1RF23EC033\t-
HEMALATHA D\t1RF23EC034\t7.17
J Chandana\t1RF23EC035\t9.15
Janke rishitha\t1RF23EC036\t6.03
Jathin M\t1RF23EC037\t6.92
Kausthubh\t1RF23EC038\t5.35
Kshitij Pandey\t1RF23EC039\t7.54
Kunda Sri Krishna Vamshi\t1RF23EC040\t9.42
Likitha G S\t1RF23EC041\t7.82
M Lakshmi Lahari\t1RF23EC042\t7.2
Medhya Parthakudi\t1RF23EC043\t8.07
MONICA SINGH S\t1RF23EC044\t7.22
MONISHA M REDDY\t1RF23EC045\t9.08
Monoddin K\t1RF23EC046\t7.57
Mukund Singh\t1RF23EC047\t8.17
Naman Shah\t1RF23EC048\t6.53
NAMRATHA V\t1RF23EC049\t6.8
NEHA SARAVANAN\t1RF23EC050\t9.49
Norin Roby Issac\t1RF23EC051\t8.39
Pramod Gouda P Patil\t1RF23EC052\t8.42
PRANEETH N\t1RF23EC053\t8.03
PRIAANSH GUPTA\t1RF23EC054\t7.3
RAJESH G.D.\t1RF23EC055\t7.73
Rishi R\t1RF23EC056\t7.11
Sharanya Varsha Nayak\t1RF23EC057\t7.28
SHREYA NAGENDRA\t1RF23EC058\t8.02
Srujan TM\t1RF23EC059\t6.67
Varun Jain\t1RF23EC061\t8.71
Vasishta RB\t1RF23EC062\t8.48
Yashupradha B S\t1RF23EC063\t8.68
CHIRANTHAN GOWDA S P\t1RF24EC400\t8.32
Mohammed Affan\t1RF24EC401\t6.87
Pradeepkumar Naragund\t1RF24EC402\t8.05
Pughal p\t1RF24EC403\t7
Varun Achar\t1RF24EC404\t6.73
Veeresha M\t1RF24EC405\t6.13"""

MONGO_URI = "mongodb+srv://5223346sohansridattaa_db_user:eCFXJ0aq7RiD6IHk@cluster0.ccgnozo.mongodb.net/?appName=Cluster0"

students_docs = []
lines = [line.strip() for line in ROSTER_DATA.strip().split('\n') if line.strip()]
for line in lines:
    parts = [p.strip() for p in line.split('\t') if p.strip()]
    if len(parts) >= 2:
        name = parts[0]
        usn = parts[1].upper()
        cgpa_str = parts[2] if len(parts) > 2 else '-'
        cgpa = None
        if cgpa_str != '-':
            try:
                cgpa = float(cgpa_str)
            except:
                cgpa = None
        doc = {
            'usn': usn,
            'name': name,
            'subjects': {},
            'cgpa': cgpa,
            'sgpa': cgpa,
            'semesters': [1] if cgpa is not None else [],
            'sgpa_map': {'1': cgpa} if cgpa is not None else {}
        }
        students_docs.append(doc)

print(f'Parsed {len(students_docs)} students')

client = MongoClient(MONGO_URI)
db = client['vtu_database']
collection = db['results']
collection.create_index('usn', unique=True)

inserted = updated = 0
for doc in students_docs:
    res = collection.update_one({'usn': doc['usn']}, {'$set': doc}, upsert=True)
    if res.matched_count > 0:
        updated += 1
    else:
        inserted += 1

print(f'Done: {inserted} inserted, {updated} updated into Atlas')
client.close()

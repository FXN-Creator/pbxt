import streamlit as st
import pandas as pd
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import warnings
warnings.filterwarnings('ignore')

# -------------------------- 核心配置 --------------------------
# 班次时间（简化为早/晚班）
SHIFT_CONFIG = {
    "早班": "13:00-22:00",
    "晚班": "16:00-01:00（周五六为17:00-02:00）"
}
# 排班规则（基于原图简化）
RULES = {
    "周一至周四": {"早班": 1, "晚班": 1, "休息": 1},  # 总人数3，匹配6人时每组3人轮
    "周五至周日": {"早班": 1, "晚班": 2, "休息": 0},  # 周五-周日原则上不休息
    "每月总休息天数": 4  # 每人每月仅4天休息
}

# -------------------------- 工具函数 --------------------------
def get_month_days(year, month):
    """获取指定年月的所有日期（含星期）"""
    days = []
    # 当月第一天
    first_day = datetime(year, month, 1)
    # 下月第一天减1天 = 当月最后一天
    last_day = datetime(year, month + 1, 1) - timedelta(days=1) if month < 12 else datetime(year + 1, 1, 1) - timedelta(days=1)
    
    current_day = first_day
    while current_day <= last_day:
        weekday = current_day.weekday()  # 0=周一，6=周日
        weekday_name = ["一", "二", "三", "四", "五", "六", "日"][weekday]
        days.append({
            "date": current_day.day,
            "weekday": weekday_name,
            "datetime": current_day
        })
        current_day += timedelta(days=1)
    return days

def check_rest_days(rest_days, total_days, person_name):
    """校验休息日需求：不超过4天、日期在当月范围内"""
    valid_rest_days = []
    rest_days = [int(d) for d in rest_days if d.strip().isdigit()]
    # 去重
    rest_days = list(set(rest_days))
    # 校验数量
    if len(rest_days) > 4:
        st.warning(f"⚠️ {person_name} 休息日需求超过4天，自动截取前4天！")
        rest_days = rest_days[:4]
    # 校验日期有效性
    for day in rest_days:
        if 1 <= day <= total_days:
            valid_rest_days.append(day)
        else:
            st.warning(f"⚠️ {person_name} 休息日{day}超出当月范围，已忽略！")
    return valid_rest_days

def generate_schedule(year, month, persons):
    """核心排班逻辑"""
    # 1. 获取当月日期和星期
    month_days = get_month_days(year, month)
    total_days = len(month_days)
    day_list = [d["date"] for d in month_days]
    weekday_list = [d["weekday"] for d in month_days]
    
    # 2. 初始化排班表
    schedule_data = {
        "部门": ["直营门店"] * len(persons),
        "姓名": [p["name"] for p in persons],
    }
    # 初始化日期列
    for day in day_list:
        schedule_data[str(day)] = [""] * len(persons)
    # 初始化统计列
    schedule_data["早"] = [0] * len(persons)
    schedule_data["晚"] = [0] * len(persons)
    schedule_data["休"] = [0] * len(persons)
    schedule_data["加"] = [0] * len(persons)  # 示例中加为0，保留字段
    schedule_data["备注"] = [""] * len(persons)
    
    # 3. 处理每人的休息日（优先满足需求，不足4天则补充）
    person_rest_days = {}
    for idx, p in enumerate(persons):
        rest_days = check_rest_days(p["rest_days"], total_days, p["name"])
        # 不足4天则自动补充（优先周一至周四）
        if len(rest_days) < 4:
            for d in month_days:
                if len(rest_days) >= 4:
                    break
                day = d["date"]
                weekday = d["weekday"]
                # 优先补充周一至周四的日期
                if day not in rest_days and weekday in ["一", "二", "三", "四"]:
                    rest_days.append(day)
        person_rest_days[p["name"]] = sorted(rest_days)
        # 标记休息日
        for day in rest_days:
            schedule_data[str(day)][idx] = "休"
            schedule_data["休"][idx] += 1
    
    # 4. 按规则分配早/晚班
    person_count = len(persons)
    for d in month_days:
        day = d["date"]
        weekday = d["weekday"]
        day_col = str(day)
        
        # 筛选当天不休息的人
        available_persons = [
            idx for idx, p in enumerate(persons)
            if schedule_data[day_col][idx] != "休"
        ]
        if not available_persons:
            continue
        
        # 按星期确定班次人数
        if weekday in ["一", "二", "三", "四"]:
            need_morning = RULES["周一至周四"]["早班"]
            need_evening = RULES["周一至周四"]["晚班"]
        else:
            need_morning = RULES["周五至周日"]["早班"]
            need_evening = RULES["周五至周日"]["晚班"]
        
        # 轮班分配（简单轮询，保证公平）
        morning_persons = available_persons[:need_morning]
        evening_persons = available_persons[need_morning:need_morning + need_evening]
        
        # 标记班次并统计
        for idx in morning_persons:
            schedule_data[day_col][idx] = "早"
            schedule_data["早"][idx] += 1
        for idx in evening_persons:
            schedule_data[day_col][idx] = "晚"
            schedule_data["晚"][idx] += 1
    
    # 5. 构建最终DataFrame（调整列顺序）
    cols = ["部门", "姓名"] + [str(d) for d in day_list] + ["早", "晚", "休", "加", "备注"]
    df_schedule = pd.DataFrame(schedule_data)[cols]
    
    # 添加表头说明（匹配示例格式）
    df_header = pd.DataFrame({
        "": ["交易所排班表"],
        "年": [year],
        "月": [month]
    })
    # 合并表头和排班表
    df_final = pd.concat([df_header, df_schedule], ignore_index=True)
    return df_final, month_days

# -------------------------- Streamlit页面 --------------------------
st.set_page_config(page_title="交易所排班系统", layout="wide")
st.title("📅 交易所排班系统（手机适配版）")

# 1. 基础设置
col1, col2 = st.columns(2)
with col1:
    # 默认当前月的下一月
    default_date = datetime.now() + relativedelta(months=1)
    selected_year = st.number_input("排班年份", value=default_date.year, min_value=2024, max_value=2099)
    selected_month = st.number_input("排班月份", value=default_date.month, min_value=1, max_value=12)
with col2:
    person_num = st.number_input("排班人数（≤6）", value=6, min_value=1, max_value=6)

# 2. 输入人员信息和休息日需求
st.subheader("👥 人员休息日需求（每月仅4天休息）")
persons = []
for i in range(person_num):
    col_name, col_rest = st.columns([1, 2])
    with col_name:
        name = st.text_input(f"人员{i+1}姓名", value=f"员工{i+1}")
    with col_rest:
        rest_days = st.text_input(
            f"{name}的休息日（输入日期，用逗号分隔，如：5,8,12,15）",
            placeholder="例如：5,8,12,15"
        ).split(",")
    persons.append({"name": name, "rest_days": rest_days})

# 3. 生成排班表
if st.button("🚀 生成排班表", type="primary"):
    with st.spinner("正在生成排班表..."):
        df_schedule, month_days = generate_schedule(selected_year, selected_month, persons)
        
        # 显示排班表
        st.subheader("📋 排班结果预览")
        st.dataframe(df_schedule, use_container_width=True)
        
        # 导出Excel
        excel_filename = f"交易所排班表_{selected_year}年{selected_month}月.xlsx"
        # 保存Excel（带格式）
        with pd.ExcelWriter(excel_filename, engine="openpyxl") as writer:
            df_schedule.to_excel(writer, sheet_name="排班表", index=False)
            # 调整列宽
            worksheet = writer.sheets["排班表"]
            for col in worksheet.columns:
                max_length = 0
                col_letter = col[0].column_letter
                for cell in col:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 15)
                worksheet.column_dimensions[col_letter].width = adjusted_width
        
        # 提供下载按钮（手机可直接下载）
        st.download_button(
            label="📥 下载Excel排班表",
            data=open(excel_filename, "rb").read(),
            file_name=excel_filename,
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

# 4. 规则说明
st.subheader("📜 排班规则说明")
st.markdown(f"""
- 班次简化为仅早/晚班：早班{SHIFT_CONFIG["早班"]}，晚班{SHIFT_CONFIG["晚班"]}；
- 人数上限6人，输入多少人则按多少人排班；
- 每人每月仅4天休息（优先满足输入的休息日，不足则补充周一至周四）；
- 周一至周四：早班1人、晚班1人、休息1人（多人时轮班）；
- 周五至周日：早班1人、晚班2人、原则上不休息；
""")

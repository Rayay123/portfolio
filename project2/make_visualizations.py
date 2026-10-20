from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd
from matplotlib.colors import Normalize
from matplotlib.patches import Patch


data_path=Path(__file__).parent / "data" / "guttmacher_by_state.xlsx"
figure_dir=Path(__file__).parent / "figures"
figure_dir.mkdir(exist_ok=True)

data=pd.read_excel(data_path,sheet_name="Guttmacher")
state_col="U.S. State"
change_col="Change in the no. of abortion clinics, 2017-2020"

clinic_change=data[[state_col,change_col]].copy()
clinic_change[change_col]=pd.to_numeric(clinic_change[change_col],errors="coerce")
clinic_change=clinic_change.dropna()

gains=clinic_change[clinic_change[change_col]>0].sort_values(change_col)
losses=clinic_change[clinic_change[change_col]<0]
no_change=clinic_change[clinic_change[change_col]==0]

total_gained=int(gains[change_col].sum())
total_lost=int(abs(losses[change_col].sum()))
net_change=int(clinic_change[change_col].sum())


plt.rcParams.update({
    "font.family":"DejaVu Sans",
    "font.size":11,
    "axes.titleweight":"bold",
    "axes.spines.top":False,
    "axes.spines.right":False,
})


# Supporting view: focus on states where the number of clinics increased.
fig,ax=plt.subplots(figsize=(10,7))
gain_norm=Normalize(vmin=gains[change_col].min(),vmax=gains[change_col].max())
green_scale=plt.colormaps["Greens"]
bar_colors=[green_scale(.38+.5*gain_norm(value)) for value in gains[change_col]]
bars=ax.barh(gains[state_col],gains[change_col],color=bar_colors)

ax.set_title("Where clinic access expanded",loc="left",fontsize=20,pad=28)
ax.text(
    0,1.015,
    f"15 states added a combined {total_gained} clinics from 2017 to 2020.",
    transform=ax.transAxes,color="#4d4d4d",fontsize=12
)
ax.set_xlabel("Change in number of abortion clinics")
ax.set_ylabel("")
ax.set_xlim(0,13)
ax.grid(axis="x",color="#dddddd",linewidth=.8)
ax.set_axisbelow(True)

for bar,value in zip(bars,gains[change_col]):
    ax.text(value+.18,bar.get_y()+bar.get_height()/2,f"+{int(value)}",va="center",fontsize=10)

shade_key=[
    Patch(facecolor=green_scale(.38),label="Smaller increase"),
    Patch(facecolor=green_scale(.88),label="Larger increase"),
]
ax.legend(handles=shade_key,title="Green shade",loc="lower right",frameon=False)

fig.text(.125,.025,"Only states with a net increase are shown.",fontsize=9,color="#666666")
fig.text(.99,.025,"Source: Guttmacher Institute Abortion Data by State",ha="right",fontsize=9,color="#666666")
fig.subplots_adjust(left=.22,right=.96,top=.85,bottom=.12)
fig.savefig(figure_dir / "supporting_access_improved.png",dpi=180,facecolor="white")
plt.close(fig)


# Opposing view: combine all states to show the nationwide result.
labels=["Clinics added\nin gain states","Clinics lost\nin loss states","National\nnet change"]
values=[total_gained,-total_lost,net_change]
colors=["#8ab69b","#c95d63","#9d2f37"]

fig,ax=plt.subplots(figsize=(10,6.4))
bars=ax.bar(labels,values,color=colors,width=.62)

ax.set_title("The United States ended with fewer clinics",loc="left",fontsize=20,pad=28)
ax.text(
    0,1.015,
    f"The 42 added clinics did not fully offset 47 lost clinics, leaving a net change of {net_change}.",
    transform=ax.transAxes,color="#4d4d4d",fontsize=12
)
ax.set_ylabel("Change in number of abortion clinics")
ax.axhline(0,color="#333333",linewidth=1)
ax.grid(axis="y",color="#dddddd",linewidth=.8)
ax.set_axisbelow(True)
ax.set_ylim(-55,50)

for bar,value in zip(bars,values):
    if value>=0:
        y=value+2
        va="bottom"
    else:
        y=value-2
        va="top"
    label=f"+{value}" if value>0 else str(value)
    ax.text(bar.get_x()+bar.get_width()/2,y,label,ha="center",va=va,fontweight="bold")

fig.text(
    .125,.025,
    f"{len(gains)} states gained clinics, {len(losses)} lost clinics, and {len(no_change)} had no change.",
    fontsize=9,color="#666666"
)
fig.text(.99,.025,"Source: Guttmacher Institute Abortion Data by State",ha="right",fontsize=9,color="#666666")
fig.subplots_adjust(left=.12,right=.96,top=.84,bottom=.17)
fig.savefig(figure_dir / "opposing_access_improved.png",dpi=180,facecolor="white")
plt.close(fig)

print(f"Created charts with gains={total_gained}, losses={total_lost}, net={net_change}")

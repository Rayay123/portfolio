from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd
from matplotlib.colors import Normalize
from matplotlib.patches import FancyBboxPatch,Patch


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


# Opposing view: a tile map highlights the states where clinics were lost.
state_abbr={
    "Alabama":"AL","Alaska":"AK","Arizona":"AZ","Arkansas":"AR","California":"CA",
    "Colorado":"CO","Connecticut":"CT","Delaware":"DE","District of Columbia":"DC",
    "Florida":"FL","Georgia":"GA","Hawaii":"HI","Idaho":"ID","Illinois":"IL",
    "Indiana":"IN","Iowa":"IA","Kansas":"KS","Kentucky":"KY","Louisiana":"LA",
    "Maine":"ME","Maryland":"MD","Massachusetts":"MA","Michigan":"MI",
    "Minnesota":"MN","Mississippi":"MS","Missouri":"MO","Montana":"MT",
    "Nebraska":"NE","Nevada":"NV","New Hampshire":"NH","New Jersey":"NJ",
    "New Mexico":"NM","New York":"NY","North Carolina":"NC","North Dakota":"ND",
    "Ohio":"OH","Oklahoma":"OK","Oregon":"OR","Pennsylvania":"PA",
    "Rhode Island":"RI","South Carolina":"SC","South Dakota":"SD","Tennessee":"TN",
    "Texas":"TX","Utah":"UT","Vermont":"VT","Virginia":"VA","Washington":"WA",
    "West Virginia":"WV","Wisconsin":"WI","Wyoming":"WY",
}

tile_positions={
    "AK":(0,0),"ME":(10,0),
    "VT":(9,1),"NH":(10,1),
    "WA":(0,2),"ID":(1,2),"MT":(2,2),"ND":(3,2),"MN":(4,2),"IL":(5,2),
    "WI":(6,2),"MI":(7,2),"NY":(8,2),"RI":(9,2),"MA":(10,2),
    "OR":(0,3),"NV":(1,3),"WY":(2,3),"SD":(3,3),"IA":(4,3),"IN":(5,3),
    "OH":(6,3),"PA":(7,3),"NJ":(8,3),"CT":(9,3),
    "CA":(0,4),"UT":(1,4),"CO":(2,4),"NE":(3,4),"MO":(4,4),"KY":(5,4),
    "WV":(6,4),"VA":(7,4),"MD":(8,4),"DE":(9,4),
    "AZ":(1,5),"NM":(2,5),"KS":(3,5),"AR":(4,5),"TN":(5,5),"NC":(6,5),
    "SC":(7,5),"DC":(8,5),
    "OK":(3,6),"LA":(4,6),"MS":(5,6),"AL":(6,6),"GA":(7,6),
    "HI":(0,7),"TX":(3,7),"FL":(8,7),
}

state_values={state_abbr[row[state_col]]:int(row[change_col]) for _,row in clinic_change.iterrows()}

def loss_color(value):
    if value<=-6:
        return "#8f2119"
    if value<=-3:
        return "#bb3529"
    return "#d85a4c"

fig,ax=plt.subplots(figsize=(11,7.4))
tile_size=.9

for state,(col,row) in tile_positions.items():
    value=state_values[state]
    is_loss=value<0
    color=loss_color(value) if is_loss else "#e5e5e1"
    tile=FancyBboxPatch(
        (col,-row),tile_size,tile_size,
        boxstyle="round,pad=0.02,rounding_size=0.08",
        facecolor=color,edgecolor="white",linewidth=1.6
    )
    ax.add_patch(tile)
    text_color="white" if is_loss else "#a0a0a0"
    ax.text(col+tile_size/2,-row+.58,state,ha="center",va="center",fontweight="bold" if is_loss else "normal",color=text_color,fontsize=10)
    if is_loss:
        ax.text(col+tile_size/2,-row+.28,str(value),ha="center",va="center",color="white",fontsize=9)

legend_items=[
    Patch(facecolor="#d85a4c",label="Lost 1–2"),
    Patch(facecolor="#bb3529",label="Lost 3–5"),
    Patch(facecolor="#8f2119",label="Lost 6 or more"),
    Patch(facecolor="#e5e5e1",label="No loss shown"),
]
ax.legend(handles=legend_items,ncol=4,loc="lower center",bbox_to_anchor=(.5,-.11),frameon=False,fontsize=9)

ax.set_xlim(-.15,11)
ax.set_ylim(-7.25,1.05)
ax.set_aspect("equal")
ax.axis("off")

fig.suptitle("Clinic losses were spread across 19 states",x=.08,y=.95,ha="left",fontsize=20,fontweight="bold")
fig.text(.08,.89,"Together, these states lost 47 clinics from 2017 to 2020.",fontsize=12,color="#4d4d4d")
fig.text(.08,.035,"Only states with a net loss are colored. States with gains or no change are gray.",fontsize=9,color="#666666")
fig.text(.98,.035,"Source: Guttmacher Institute Abortion Data by State",ha="right",fontsize=9,color="#666666")
fig.subplots_adjust(left=.07,right=.97,top=.84,bottom=.16)
fig.savefig(figure_dir / "opposing_access_improved.png",dpi=180,facecolor="white")
plt.close(fig)

print(f"Created charts with gains={total_gained}, losses={total_lost}, net={net_change}")

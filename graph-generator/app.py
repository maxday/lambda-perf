#!/usr/bin/env python3

import concurrent.futures
import glob
import io
import json
import os
from datetime import datetime, timedelta

import matplotlib

matplotlib.use("Agg")  # Non-interactive backend for process safety
matplotlib.rcParams["svg.fonttype"] = "none"  # Use system fonts for styling support
import matplotlib.dates as mdates
import matplotlib.pyplot as plt
import pandas as pd

# This script is intended to be run from the root of the repository
# or from within the graph-generator directory.
# We'll use the script's location to determine the project root.
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
GRAPHS_DIR = os.path.join(BASE_DIR, "graphs")


def load_data():
    # Load all json files recursively to be robust against subdirectory archiving
    pattern = os.path.join(DATA_DIR, "**", "*.json")
    all_files = glob.glob(pattern, recursive=True)
    data_list = []

    # Calculate the cutoff date (2 years ago from today)
    # Using the context's date as a reference if available, otherwise actual today
    now = datetime.now()
    cutoff_date = now - timedelta(days=365 * 2)
    cutoff_str = cutoff_date.strftime("%Y-%m-%d")

    print(f"Filtering for data since {cutoff_str}...")

    for filename in all_files:
        # Extract the date from the filename (expecting YYYY-MM-DD.json)
        base_name = os.path.basename(filename)
        if not base_name[0].isdigit():  # Skip non-data files like last.json
            continue

        file_date_str = base_name.replace(".json", "")
        if file_date_str < cutoff_str:
            continue

        try:
            with open(filename, "r") as f:
                content = json.load(f)
                generated_at = content.get("metadata", {}).get("generatedAt")
                if not generated_at:
                    continue

                for entry in content.get("runtimeData", []):
                    # Extract the 'path' part of the runtime.
                    runtime_id = entry.get("r", "")
                    runtime_path = runtime_id.replace("lambda-perf-", "").split("-")[0]

                    data_list.append(
                        {
                            "generatedAt": generated_at,
                            "runtime": runtime_path,
                            "architecture": entry.get("a"),
                            "packaging": entry.get("p"),
                            "memory_limit": entry.get("m"),
                            "acd": entry.get("acd"),  # Cold start
                            "ad": entry.get("ad"),  # Warm start
                            "mu": entry.get("mu"),  # Memory used
                            "region": "us-east-1",  # Defaulting to us-east-1 as per user hint
                        }
                    )
        except Exception as e:
            print(f"Error reading {filename}: {e}")

    df = pd.DataFrame(data_list)
    if not df.empty:
        df["generatedAt"] = pd.to_datetime(df["generatedAt"])
    return df


def generate_graphs(df):
    os.makedirs(GRAPHS_DIR, exist_ok=True)

    # Use the most recent date in the dataset as "today" for relative windowing
    now = df["generatedAt"].max()
    date_180d = now - timedelta(days=180)
    date_2y = now - timedelta(days=365 * 2)

    groups = list(
        df.groupby(["runtime", "architecture", "packaging", "memory_limit", "region"])
    )

    print(f"Starting parallel generation of {len(groups) * 2} graphs...")

    with concurrent.futures.ProcessPoolExecutor() as executor:
        futures = []
        for (runtime, arch, pkg, mem_limit, region), group in groups:
            group = group.sort_values("generatedAt")

            # Large Graph (2 years)
            group_2y = group[group["generatedAt"] >= date_2y]
            if not group_2y.empty:
                futures.append(
                    executor.submit(
                        save_plot,
                        group_2y,
                        runtime,
                        arch,
                        pkg,
                        mem_limit,
                        region,
                        "2y",
                        (1024, 768),
                    )
                )

            # Small Graph (180 days)
            group_180d = group[group["generatedAt"] >= date_180d]
            if not group_180d.empty:
                futures.append(
                    executor.submit(
                        save_plot,
                        group_180d,
                        runtime,
                        arch,
                        pkg,
                        mem_limit,
                        region,
                        "180d",
                        (300, 170),
                        is_small=True,
                    )
                )

        for future in concurrent.futures.as_completed(futures):
            try:
                future.result()
            except Exception as e:
                print(f"A task failed: {e}")


def save_plot(
    data, runtime, arch, pkg, mem_limit, region, suffix, dimensions, is_small=False
):
    width, height = dimensions
    dpi = 100

    # Colors
    LIGHT_FG = "#212529"
    LIGHT_GRID = "#dee2e6"

    # Use markers for theme support on small graphs, actual colors for large ones
    FG = "#000001" if is_small else LIGHT_FG
    GRID = "#000002" if is_small else LIGHT_GRID

    fig, ax1 = plt.subplots(figsize=(width / dpi, height / dpi), dpi=dpi)

    if is_small:
        fig.patch.set_alpha(0)
        ax1.patch.set_alpha(0)
    else:
        fig.patch.set_facecolor("white")
        ax1.patch.set_facecolor("white")

    if is_small:
        # Line colors (keep blue/red but ensure they are vibrant)
        ax1.plot(
            data["generatedAt"],
            data["acd"],
            color="#339af0",
            label="Cold Start",
            linewidth=1.2,
        )
        ax1.plot(
            data["generatedAt"],
            data["ad"],
            color="#ff6b6b",
            label="Warm Start",
            linewidth=1.2,
        )

        # Axis and label styling
        ax1.xaxis.set_major_formatter(mdates.DateFormatter("%m/%Y"))
        ax1.xaxis.set_major_locator(mdates.MonthLocator(interval=2))

        ax1.tick_params(axis="both", which="major", labelsize=7, colors=FG)
        ax1.spines["bottom"].set_color(FG)
        ax1.spines["top"].set_visible(False)
        ax1.spines["right"].set_visible(False)
        ax1.spines["left"].set_color(FG)

        ax1.set_ylabel("ms", fontsize=7, color=FG)
        ax1.grid(True, linestyle="--", color=GRID)
        plt.tight_layout(pad=0.5)
    else:
        # Plot Cold Start (Blue) and Warm Start (Red) on ax1
        ax1.plot(
            data["generatedAt"],
            data["acd"],
            color="#007bff",
            label="Cold Start",
            linewidth=1.5,
            marker="o",
            markersize=4,
        )
        ax1.plot(
            data["generatedAt"],
            data["ad"],
            color="#dc3545",
            label="Warm Start",
            linewidth=1.5,
            marker="o",
            markersize=4,
        )

        # Create twin axis for Memory Usage (Orange) only on large graphs
        ax2 = ax1.twinx()
        ax2.plot(
            data["generatedAt"],
            data["mu"],
            color="#ff7f0e",
            label="Memory",
            linewidth=1.5,
            linestyle="--",
        )

        ax1.xaxis.set_major_formatter(mdates.DateFormatter("%m/%Y"))
        ax1.xaxis.set_major_locator(mdates.MonthLocator(interval=3))

        ax1.set_xlabel("Time", color=FG)
        ax1.set_ylabel("Duration [ms]", color=FG)
        ax2.set_ylabel("Memory Usage [MB]", color="#ff7f0e")
        ax1.tick_params(axis="both", colors=FG)
        ax2.tick_params(axis="y", labelcolor="#ff7f0e", colors=FG)

        # Color spines
        ax1.spines["left"].set_color(FG)
        ax1.spines["bottom"].set_color(FG)
        ax1.spines["top"].set_color(FG)
        ax1.spines["right"].set_visible(False)
        ax2.spines["right"].set_color("#ff7f0e")
        ax2.spines["left"].set_visible(False)
        ax2.spines["top"].set_visible(False)
        ax2.spines["bottom"].set_visible(False)

        plt.title(f"{runtime} ({arch}, {pkg}, {mem_limit}MB, {region})", color=FG)
        ax1.grid(True, linestyle="--", color=GRID)

        # Legend: Combine legends from both axes
        lines1, labels1 = ax1.get_legend_handles_labels()
        lines2, labels2 = ax2.get_legend_handles_labels()
        leg = ax1.legend(
            lines1 + lines2, labels1 + labels2, loc="upper left", fontsize="small"
        )
        if leg:
            leg.get_frame().set_edgecolor(FG)
            leg.get_frame().set_facecolor("none")
            for text in leg.get_texts():
                text.set_color(FG)

        plt.xticks(rotation=45, color=FG)
        plt.tight_layout()

    # Save to buffer
    buf = io.StringIO()
    plt.savefig(buf, format="svg", transparent=is_small)
    svg_data = buf.getvalue()

    if is_small:
        # Use markers to inject CSS variables only for small graphs
        svg_data = svg_data.replace("#000001", "var(--fg-color)")
        svg_data = svg_data.replace("#000002", "var(--grid-color)")

        style = f"""
  <style>
    :root {{
      --fg-color: {LIGHT_FG};
      --grid-color: rgba(33, 37, 41, 0.1);
    }}
    @media (prefers-color-scheme: dark) {{
      :root {{
        --fg-color: #dee2e6;
        --grid-color: rgba(248, 249, 250, 0.15);
      }}
    }}
  </style>
"""
        # Insert style inside <svg> tag
        svg_tag_end = svg_data.find(">", svg_data.find("<svg"))
        if svg_tag_end != -1:
            svg_data = svg_data[: svg_tag_end + 1] + style + svg_data[svg_tag_end + 1 :]

    # Format memory as integer for the filename
    mem_int = int(float(mem_limit))
    filename = f"last-{runtime}-{arch}-{pkg}-{mem_int}-{region}-{suffix}.svg"
    filepath = os.path.join(GRAPHS_DIR, filename)
    with open(filepath, "w") as f:
        f.write(svg_data)
    plt.close(fig)


if __name__ == "__main__":
    print("Loading data...")
    df = load_data()
    if df.empty:
        print("No data found.")
    else:
        print(f"Processing {len(df)} data points...")
        generate_graphs(df)
        print("Done.")

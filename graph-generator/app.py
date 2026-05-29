import concurrent.futures
import glob
import json
import os
from datetime import datetime, timedelta

import matplotlib

matplotlib.use("Agg")  # Non-interactive backend for process safety
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

    # Background color for the web page
    bg_color = "#212529"

    fig, ax1 = plt.subplots(figsize=(width / dpi, height / dpi), dpi=dpi)

    if is_small:
        fig.patch.set_facecolor(bg_color)
        ax1.set_facecolor(bg_color)

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

        # Axis and label styling for dark background
        ax1.xaxis.set_major_formatter(mdates.DateFormatter("%m/%Y"))
        ax1.xaxis.set_major_locator(mdates.MonthLocator(interval=2))

        ax1.tick_params(axis="both", which="major", labelsize=7, colors="#dee2e6")
        ax1.spines["bottom"].set_color("#495057")
        ax1.spines["top"].set_visible(False)
        ax1.spines["right"].set_visible(False)
        ax1.spines["left"].set_color("#495057")

        ax1.set_ylabel("ms", fontsize=7, color="#dee2e6")
        ax1.grid(True, linestyle="--", alpha=0.1, color="#f8f9fa")
        plt.tight_layout(pad=0.5)
    else:
        # Large graph keeps default white background for "click-in" view unless requested otherwise
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

        ax1.set_xlabel("Time")
        ax1.set_ylabel("Duration [ms]")
        ax2.set_ylabel("Memory Usage [MB]", color="#ff7f0e")
        ax1.tick_params(axis="y", labelcolor="#333")
        ax2.tick_params(axis="y", labelcolor="#ff7f0e")

        plt.title(f"{runtime} ({arch}, {pkg}, {mem_limit}MB, {region})")
        ax1.grid(True, linestyle="--", alpha=0.6)

        # Legend: Combine legends from both axes
        lines1, labels1 = ax1.get_legend_handles_labels()
        lines2, labels2 = ax2.get_legend_handles_labels()
        ax1.legend(
            lines1 + lines2, labels1 + labels2, loc="upper left", fontsize="small"
        )

        plt.xticks(rotation=45)
        plt.tight_layout()

    # Format memory as integer for the filename
    mem_int = int(float(mem_limit))
    filename = f"last-{runtime}-{arch}-{pkg}-{mem_int}-{region}-{suffix}.svg"
    filepath = os.path.join(GRAPHS_DIR, filename)
    plt.savefig(filepath)
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

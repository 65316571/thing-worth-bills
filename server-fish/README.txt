conda create -n goofish python=3.11 -y
conda activate goofish
python -m pip install -U pip
pip install -r requirements-runtime.txt
python -m src.app
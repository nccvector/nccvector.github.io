import argparse
import glob
import subprocess

parser = argparse.ArgumentParser(description='Process deploy flags')
parser.add_argument('--deploy', action='store_true', help='Removes notebooks')

# Parsing arguments
args = parser.parse_args()

# root_dir needs a trailing slash (i.e. /root/dir/)
root_dir = "./"
for filename in glob.iglob(root_dir + '**/*.ipynb', recursive=True):
    subprocess.run(["echo", filename])
    
    subprocess.run(["jupyter-nbconvert", filename, "--to", "markdown"])

    if args.deploy:
        print("Removing notebooks")
        subprocess.run(["sudo", "rm", filename])
    
    # Append the post layout on top
    with open(filename.split(".ipynb")[0] + ".md", "r+") as fp:
        lines = fp.readlines()     # lines is list of line, each element '...\n'

        # open the mathjax script
        temp = open("post_header.txt", "r")
        lines.insert(0, temp.read())  # you can use any index if you know the line index
        fp.seek(0)                 # file pointer locates at the beginning to write the whole file again
        fp.writelines(lines)       # write whole lists again to the same file
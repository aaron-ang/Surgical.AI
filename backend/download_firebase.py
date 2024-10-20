import argparse
from firebase_admin import credentials, initialize_app, storage


def main(source_path: str, output_path: str = None):
    cred = credentials.Certificate(
        "calhacks2024-c1a62-firebase-adminsdk-9obo0-63385ce9b4.json"
    )
    initialize_app(cred, {"storageBucket": "calhacks2024-c1a62.appspot.com"})
    bucket = storage.bucket()
    blob = bucket.blob(source_path)
    if output_path is None:
        output_path = source_path
    blob.download_to_filename(output_path)


if __name__ == "__main__":
    args = argparse.ArgumentParser()
    args.add_argument("path", type=str, help="Path of the file in Firebase")
    args.add_argument(
        "-o",
        "--output",
        type=str,
        default=None,
        help="Path to the output file (default: same as input)",
    )
    args = args.parse_args()
    main(args.path, args.output)

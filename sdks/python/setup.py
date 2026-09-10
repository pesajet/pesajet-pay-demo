from setuptools import setup, find_packages

setup(
    name="pesajet",
    version="1.0.0",
    description="Official PesaJet Payments & Webhooks SDK for Python",
    packages=find_packages(),
    install_requires=[
        "requests>=2.25.0",
    ],
    url="https://pay.pesajet.com",
    project_urls={
        "Homepage": "https://pay.pesajet.com",
        "Repository": "https://github.com/pesajet/pesajet-pay-demo",
    },
    python_requires=">=3.8",
)


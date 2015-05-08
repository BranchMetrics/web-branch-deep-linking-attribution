echo "Integration Guide URL: https://github.com/BranchMetrics/Branch-Integration-Guides/blob/master/smart-banner-guide.md"
read -p "Did you update the Branch Integration Guide?" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
	echo "Ok"
fi
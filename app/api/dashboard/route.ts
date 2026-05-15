import { redis } from "@/lib/redis";

async function getDriveData(accessToken:string) {
    
    const res = await fetch(
        "https://www.googleapis.com/drive/v3/files?pageSize=1000&fields=files(id,name,size,mimeType,createdTime,webViewLink)",
        {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    );

    const data = await res.json();

    
    return data.files || []
}

function analyzeDrive(files: any[]) {

    const sortedFiles = [...files]
        .filter((file: any) => file.size)
        .sort(
            (a: any, b: any) =>
                Number(b.size) - Number(a.size)
    );

    //largest files
    const largestDriveFiles = sortedFiles.slice(0, 10);

    //cleanup candidates
    const cleanupCandidates = sortedFiles.filter((file: any) => {

        const sizeMB = Number(file.size) / (1024 * 1024);

        const mime = file.mimeType || "";

        const createdYear = new Date(file.createdTime).getFullYear();

        return (
            sizeMB > 100 ||
            mime.includes("video") ||
            mime.includes("zip") ||
            mime.includes("rar") ||
            createdYear < 2024
        )
    })
    .slice(0, 12);

    //categories
    const buildCategory = (
        title: string,
        icon: string,
        files: any[]
    ) => ({
        title,
        icon,
        files,

        totalSize: files.reduce(
            (acc: number, file: any) => 
                acc + Number(file.size || 0),
            0
        )
    });

    const categories = [
        buildCategory(
            "Large Videos",
            "🎥",
            sortedFiles.filter(
                (file: any) =>
                file.mimeType?.includes("video")
            )
        ),

        buildCategory(
            "Archives",
            "🗜️",
            sortedFiles.filter(
                (file: any) =>
                file.mimeType?.includes("zip") ||
                file.mimeType?.includes("rar")
            )
        ),

        buildCategory(
            "PDF Documents",
            "📄",
            sortedFiles.filter(
                    (file: any) =>
                    file.mimeType?.includes("pdf")
            )
        ),

        buildCategory(
            "Old Files",
            "🕒",
            sortedFiles.filter((file: any) => {

                const year =
                new Date(file.createdTime)
                    .getFullYear();

                return year < 2024;

            })
        ),
    ]

    //duplicates
    const duplicateMap: Record<string, any[]> = {};

    sortedFiles.forEach((file : any) => {
        if(!file.name || !file.size) return;

        const key = `${file.name} - ${file.size}`;

        if (!duplicateMap[key]) {
            duplicateMap[key] = [];
        }

        duplicateMap[key].push(file)
    });

    const duplicateFiles = Object.values(duplicateMap)
        .filter((group: any) => group.length > 1)
        .map((group: any) => {

            const file = group[0];

            return {
                name: file.name,
                size: Number(file.size),
                mimeType: file.mimeType,
                count: group.length,

                wastedSpace: 
                    Number(file.size) * 
                    (group.length - 1),
                
                    files: group
            };
        })
        .sort(
            (a: any, b: any) => 
                b.wastedSpace - a.wastedSpace
        ).slice(0, 10);

        //total drive size
        const driveSize = sortedFiles.reduce(
            (sum: number, file: any) =>
                sum + Number(file.size),
            0
        );

        return {
            driveFiles: sortedFiles,
            largestDriveFiles,
            cleanupCandidates,
            cleanupCategories: categories,
            duplicateFiles,
            driveSize
        }
}


export async function GET(req: Request) {
    const accessToken = req.headers.get("authorization");
    
    if(!accessToken) {
        return Response.json({
            error: "No access token"
        })
    }

    try {
        const cacheKey = `ghostspace-dashboard`;

        const cached = await redis.get(cacheKey);

        if (cached) {
            return Response.json({
                success: true,
                source: "redis",
                ...cached
            });
        }

        const files = await getDriveData(accessToken);

        const analytics = analyzeDrive(files);

        await redis.set(
            cacheKey,
            analytics,
            {
                ex: 60 * 15
            }
        );

        return Response.json({
            success: true,
            source: "fresh",
            ...analytics
        })
    } catch(error) {
        console.log(error);
        return Response.json({
            error: "Failed to fetch dashboard data",
        })
    }
}
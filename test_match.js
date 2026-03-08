import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Invoking campus-match...");
    const { data, error } = await supabase.functions.invoke('campus-match', {
        body: { query: 'Saya ingin S2 di bidang public policy untuk membantu mengurangi stunting di Indonesia Timur.' }
    });

    if (error) {
        console.error("Function Error:", error);
    } else {
        console.log("Function Data:", data);
    }
}

test();
